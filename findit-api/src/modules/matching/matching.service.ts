import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { Match } from './match.entity';
import { Report, ReportStatut, ReportType } from '../reports/report.entity';
import { User } from '../users/user.entity';
import { Review } from '../reviews/review.entity';

type CandidateRow = {
  candidate_id: string;
  candidate_type: ReportType;
  candidate_titre: string;
  candidate_description: string;
  candidate_adresse: string;
  candidate_categorie: string;
  candidate_date_evenement: string;
  candidate_photos: string[];
  candidate_user_id: string;
  candidate_user_nom: string;
  distance_meters: string;
};

@Injectable()
export class MatchingService {
  private readonly frenchStopwords = new Set([
    'le',
    'la',
    'les',
    'de',
    'un',
    'une',
    'des',
    'et',
    'ou',
    'a',
    'à',
    'en',
  ]);

  constructor(
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('report.created')
  async handleReportCreatedEvent(report: Report): Promise<void> {
    await this.computeMatchesForReport(report);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async recomputeReportsWithoutMatches(): Promise<void> {
    const reports = await this.reportsRepository
      .createQueryBuilder('r')
      .leftJoin(
        Match,
        'm',
        'm.report_lost_id = r.id OR m.report_found_id = r.id',
      )
      .where('r.is_visible = true')
      .andWhere('r.moderation_pending = false')
      .andWhere('r.statut = :statut', { statut: ReportStatut.EN_ATTENTE })
      .andWhere('m.id IS NULL')
      .getMany();

    for (const report of reports) {
      await this.computeMatchesForReport(report);
    }
  }

  async computeMatchesForReport(report: Report): Promise<void> {
    if (
      !report.is_visible ||
      report.moderation_pending ||
      report.statut !== ReportStatut.EN_ATTENTE
    ) {
      return;
    }

    const reportForScoring =
      report.description !== undefined
        ? report
        : await this.reportsRepository.findOne({ where: { id: report.id } });

    if (!reportForScoring) {
      return;
    }

    const isLostInput = reportForScoring.type === ReportType.LOST;

    const params = {
      reportId: reportForScoring.id,
      oppositeType: isLostInput ? ReportType.FOUND : ReportType.LOST,
      categorie: reportForScoring.categorie,
      distanceMax: 5000,
      lostDate: isLostInput ? reportForScoring.date_evenement : null,
      foundDate: !isLostInput ? reportForScoring.date_evenement : null,
    };

    const candidatesRaw: unknown = await this.reportsRepository.query(
      `SELECT
         c.id AS candidate_id,
         c.type AS candidate_type,
         c.titre AS candidate_titre,
         c.description AS candidate_description,
         c.adresse AS candidate_adresse,
         c.categorie AS candidate_categorie,
         c.date_evenement AS candidate_date_evenement,
         c.photos AS candidate_photos,
         c.user_id AS candidate_user_id,
         u.nom AS candidate_user_nom,
         ST_Distance(c.location, r.location) AS distance_meters
       FROM reports c
       JOIN reports r ON r.id = $1
       JOIN users u ON u.id = c.user_id
       WHERE c.id <> $1
         AND c.type = $2
         AND c.categorie = $3
         AND c.is_visible = true
         AND c.moderation_pending = false
         AND c.statut = 'en_attente'
         AND ST_DWithin(c.location, r.location, $4)
         AND (
           ($5::date IS NOT NULL AND c.date_evenement >= ($5::date - INTERVAL '1 day'))
           OR
           ($6::date IS NOT NULL AND ($6::date >= (c.date_evenement - INTERVAL '1 day')))
         )
         AND NOT EXISTS (
           SELECT 1 FROM matches m
           WHERE (m.report_lost_id = $1 AND m.report_found_id = c.id)
              OR (m.report_found_id = $1 AND m.report_lost_id = c.id)
         )`,
      [
        params.reportId,
        params.oppositeType,
        params.categorie,
        params.distanceMax,
        params.lostDate,
        params.foundDate,
      ],
    );

    if (!Array.isArray(candidatesRaw)) {
      return;
    }

    const candidates = candidatesRaw as CandidateRow[];

    const threshold = this.configService.get<number>('app.matchScoreThreshold') ?? 0.5;

    const scored = candidates
      .map((candidate) => {
        const distanceMeters = Number.parseFloat(candidate.distance_meters);
        const scoreDistance =
          distanceMeters > 5000 ? 0 : 1 - distanceMeters / 5000;

        const scoreText = this.computeJaccardSimilarity(
          `${reportForScoring.titre} ${reportForScoring.description}`,
          `${candidate.candidate_titre} ${candidate.candidate_description}`,
        );

        const lostDate = new Date(
          isLostInput ? reportForScoring.date_evenement : candidate.candidate_date_evenement,
        );
        const foundDate = new Date(
          isLostInput ? candidate.candidate_date_evenement : reportForScoring.date_evenement,
        );
        const scoreDate = this.computeDateScore(lostDate, foundDate);

        const finalScore = 0.4 * scoreDistance + 0.35 * scoreText + 0.25 * scoreDate;

        return {
          candidate,
          distanceMeters,
          finalScore: Number(finalScore.toFixed(3)),
        };
      })
      .filter((item) => item.finalScore >= threshold)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 5);

    for (const item of scored) {
      const reportLostId = isLostInput ? reportForScoring.id : item.candidate.candidate_id;
      const reportFoundId = isLostInput ? item.candidate.candidate_id : reportForScoring.id;

      let match = await this.matchesRepository.findOne({
        where: {
          report_lost_id: reportLostId,
          report_found_id: reportFoundId,
        },
      });

      let isNew = false;
      if (!match) {
        isNew = true;
        match = this.matchesRepository.create({
          report_lost_id: reportLostId,
          report_found_id: reportFoundId,
          score: item.finalScore,
          notified: false,
        });
      } else {
        match.score = item.finalScore;
      }

      await this.matchesRepository.save(match);

      if (isNew && match.notified === false) {
        this.eventEmitter.emit('match.created', {
          matchId: match.id,
          reportLostId,
          reportFoundId,
          score: match.score,
        });
      }
    }
  }

  async getMatchesForReport(reportId: string, currentUserId: string) {
    const report = await this.reportsRepository.findOne({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const canAccess = report.is_visible || report.user_id === currentUserId;
    if (!canAccess) {
      throw new NotFoundException('Report not found');
    }

    const isLostReport = report.type === ReportType.LOST;
    const matches = await this.matchesRepository.find({
      where: isLostReport
        ? { report_lost_id: report.id }
        : { report_found_id: report.id },
      relations: ['reportLost', 'reportFound'],
      order: { score: 'DESC' },
      take: 5,
    });

    const otherReportIds = matches.map((match) =>
      isLostReport ? match.report_found_id : match.report_lost_id,
    );

    const distancesRaw: unknown = await this.reportsRepository.query(
      `SELECT
         source.id AS source_id,
         target.id AS target_id,
         ST_Distance(source.location, target.location) AS distance_meters
       FROM reports source
       JOIN reports target ON target.id = ANY($2::uuid[])
       WHERE source.id = $1`,
      [report.id, otherReportIds.length ? otherReportIds : ['00000000-0000-0000-0000-000000000000']],
    );
    const distanceRows = Array.isArray(distancesRaw)
      ? (distancesRaw as Array<{ target_id: string; distance_meters: string }>)
      : [];

    const distanceMap = new Map<string, number>(
      distanceRows.map((row) => [
        row.target_id,
        Math.round(Number.parseFloat(row.distance_meters)),
      ]),
    );

    const usersMap = await this.getUsersReliabilityByReportIds(otherReportIds);

    return {
      data: matches.map((match) => {
        const otherReport = isLostReport ? match.reportFound : match.reportLost;
        const userInfo = usersMap.get(otherReport.user_id);
        return {
          match_id: match.id,
          score: Number(match.score),
          report: {
            id: otherReport.id,
            type: otherReport.type,
            titre: otherReport.titre,
            adresse: otherReport.adresse,
            categorie: otherReport.categorie,
            first_photo_url: otherReport.photos?.[0] ?? null,
            date_evenement: otherReport.date_evenement,
            distance_meters: distanceMap.get(otherReport.id) ?? null,
            user: {
              nom: userInfo?.nom ?? 'Utilisateur',
              note_fiabilite: userInfo?.note_fiabilite ?? null,
            },
          },
        };
      }),
    };
  }

  private computeDateScore(lostDate: Date, foundDate: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const deltaDays = Math.abs(Math.floor((foundDate.getTime() - lostDate.getTime()) / msPerDay));

    if (deltaDays <= 1) return 1;
    if (deltaDays <= 3) return 0.75;
    if (deltaDays <= 7) return 0.5;
    if (deltaDays <= 14) return 0.25;
    return 0;
  }

  private computeJaccardSimilarity(left: string, right: string): number {
    const leftTokens = this.tokenize(left);
    const rightTokens = this.tokenize(right);

    if (leftTokens.size === 0 && rightTokens.size === 0) {
      return 0;
    }

    let intersection = 0;
    for (const token of leftTokens) {
      if (rightTokens.has(token)) {
        intersection += 1;
      }
    }

    const unionSize = new Set([...leftTokens, ...rightTokens]).size;
    return unionSize === 0 ? 0 : intersection / unionSize;
  }

  private tokenize(text: string): Set<string> {
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ' ')
      .replace(/[^a-z0-9\s]/gi, ' ')
      .trim();

    return new Set(
      normalized
        .split(/\s+/)
        .filter((token) => token.length >= 2 && !this.frenchStopwords.has(token)),
    );
  }

  private async getUsersReliabilityByReportIds(reportIds: string[]) {
    if (reportIds.length === 0) {
      return new Map<string, { nom: string; note_fiabilite: number | null }>();
    }

    const reports = await this.reportsRepository.find({
      where: reportIds.map((id) => ({ id })),
      relations: ['user'],
    });

    const userIds = [...new Set(reports.map((report) => report.user_id))];
    const users = await this.usersRepository.find({ where: userIds.map((id) => ({ id })) });

    const reviewStatsRaw = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('review.reviewed_id', 'reviewed_id')
      .addSelect('COUNT(review.id)', 'count')
      .addSelect('AVG(review.note)', 'avg')
      .where('review.reviewed_id IN (:...userIds)', { userIds })
      .groupBy('review.reviewed_id')
      .getRawMany<{ reviewed_id: string; count: string; avg: string }>();

    const statsMap = new Map(
      reviewStatsRaw.map((row) => [row.reviewed_id, row]),
    );

    const result = new Map<string, { nom: string; note_fiabilite: number | null }>();
    for (const user of users) {
      const stats = statsMap.get(user.id);
      const count = Number.parseInt(stats?.count ?? '0', 10);
      const note =
        count >= 3 && stats?.avg
          ? Number(Number.parseFloat(stats.avg).toFixed(2))
          : null;
      result.set(user.id, {
        nom: user.nom,
        note_fiabilite: note,
      });
    }

    return result;
  }
}
