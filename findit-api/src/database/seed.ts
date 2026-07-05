import { config } from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User, AuthProvider } from '../modules/users/user.entity';
import {
  Report,
  ReportCategorie,
  ReportStatut,
  ReportType,
} from '../modules/reports/report.entity';
import { Match } from '../modules/matching/match.entity';
import {
  Conversation,
  ConversationStatut,
} from '../modules/conversations/conversation.entity';
import { Message } from '../modules/messages/message.entity';
import { Review } from '../modules/reviews/review.entity';
import { RefreshToken } from '../modules/auth/refresh-token.entity';
import { EmailVerification } from '../modules/auth/email-verification.entity';
import { PasswordReset } from '../modules/auth/password-reset.entity';
import { ReportFlag } from '../modules/flags/report-flag.entity';

config({ path: resolve(__dirname, '../../.env') });

const DEMO_PASSWORD = 'Showcase123!';

// Showcase center — Meknès, Morocco (demo location)
const SHOWCASE_CENTER = { lat: 33.889293, lng: -5.548943 };

/** Returns [longitude, latitude] with small offsets in degrees (~1° lat ≈ 111 km). */
function loc(latOffset = 0, lngOffset = 0): [number, number] {
  return [SHOWCASE_CENTER.lng + lngOffset, SHOWCASE_CENTER.lat + latOffset];
}

const PHOTOS = {
  iphone:
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=400&fit=crop',
  keys:
    'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&h=400&fit=crop',
  bag: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=400&fit=crop',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=400&fit=crop',
  wallet:
    'https://images.unsplash.com/photo-1625727850205-d51d063c0659?w=600&h=400&fit=crop',
  airpods:
    'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&h=400&fit=crop',
  watch:
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop',
  passport:
    'https://images.unsplash.com/photo-1554224311-beee415c201f?w=600&h=400&fit=crop',
  jacket:
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=400&fit=crop',
  ring:
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=400&fit=crop',
};

function daysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().slice(0, 10);
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

async function setReportLocation(
  dataSource: DataSource,
  reportId: string,
  lng: number,
  lat: number,
): Promise<void> {
  await dataSource.query(
    `UPDATE reports
     SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
     WHERE id = $3`,
    [lng, lat, reportId],
  );
}

async function main(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [
      User,
      Report,
      Match,
      Conversation,
      Message,
      Review,
      RefreshToken,
      EmailVerification,
      PasswordReset,
      ReportFlag,
    ],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Connected to database');

  const existingTables = (
    (await dataSource.query<{ tablename: string }[]>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    )) ?? []
  ).map((row) => row.tablename);

  const tablesToClear = [
    'messages',
    'reviews',
    'conversations',
    'matches',
    'report_flags',
    'reports',
    'refresh_tokens',
    'email_verifications',
    'password_resets',
    'users',
  ].filter((table) => existingTables.includes(table));

  if (tablesToClear.length > 0) {
    await dataSource.query(
      `TRUNCATE TABLE ${tablesToClear.join(', ')} RESTART IDENTITY CASCADE`,
    );
  }
  console.log('Cleared existing data');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const userRepo = dataSource.getRepository(User);

  const users = await userRepo.save([
    userRepo.create({
      email: 'demo@findit.app',
      nom: 'Marie Dupont',
      password_hash: passwordHash,
      provider: AuthProvider.EMAIL,
      email_verified: true,
      photo_url: 'https://i.pravatar.cc/150?u=marie-dupont',
    }),
    userRepo.create({
      email: 'thomas.martin@email.fr',
      nom: 'Thomas Martin',
      password_hash: passwordHash,
      provider: AuthProvider.EMAIL,
      email_verified: true,
      photo_url: 'https://i.pravatar.cc/150?u=thomas-martin',
    }),
    userRepo.create({
      email: 'sophie.bernard@email.fr',
      nom: 'Sophie Bernard',
      password_hash: passwordHash,
      provider: AuthProvider.EMAIL,
      email_verified: true,
      photo_url: 'https://i.pravatar.cc/150?u=sophie-bernard',
    }),
    userRepo.create({
      email: 'lucas.petit@email.fr',
      nom: 'Lucas Petit',
      password_hash: passwordHash,
      provider: AuthProvider.EMAIL,
      email_verified: true,
      photo_url: 'https://i.pravatar.cc/150?u=lucas-petit',
    }),
    userRepo.create({
      email: 'emma.leroy@email.fr',
      nom: 'Emma Leroy',
      password_hash: passwordHash,
      provider: AuthProvider.EMAIL,
      email_verified: true,
      photo_url: 'https://i.pravatar.cc/150?u=emma-leroy',
    }),
    userRepo.create({
      email: 'pierre.moreau@email.fr',
      nom: 'Pierre Moreau',
      password_hash: passwordHash,
      provider: AuthProvider.EMAIL,
      email_verified: true,
      photo_url: 'https://i.pravatar.cc/150?u=pierre-moreau',
    }),
    userRepo.create({
      email: 'camille.roux@email.fr',
      nom: 'Camille Roux',
      password_hash: passwordHash,
      provider: AuthProvider.EMAIL,
      email_verified: true,
      photo_url: 'https://i.pravatar.cc/150?u=camille-roux',
    }),
    userRepo.create({
      email: 'julien.faure@email.fr',
      nom: 'Julien Faure',
      password_hash: passwordHash,
      provider: AuthProvider.EMAIL,
      email_verified: true,
      photo_url: 'https://i.pravatar.cc/150?u=julien-faure',
    }),
  ]);

  const [marie, thomas, sophie, lucas, emma, pierre, camille, julien] = users;
  const reportRepo = dataSource.getRepository(Report);

  const reports = await reportRepo.save([
    // --- Strong match pairs ---
    reportRepo.create({
      user_id: marie.id,
      type: ReportType.LOST,
      titre: 'iPhone 15 Pro noir perdu',
      description:
        'iPhone 15 Pro noir avec coque transparente et sticker de la Koutoubia. Perdu place El Hedim vers 18h30. Écran verrouillé, traceur activé.',
      categorie: ReportCategorie.ELECTRONIQUE,
      date_evenement: daysAgo(2),
      heure_evenement: '18:30:00',
      adresse: 'Place El Hedim, Meknès',
      photos: [PHOTOS.iphone],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: thomas.id,
      type: ReportType.FOUND,
      titre: 'iPhone 15 Pro noir trouvé',
      description:
        'iPhone 15 Pro noir trouvé près de Bab Mansour, coque transparente avec sticker de la Koutoubia. Batterie faible, écran verrouillé.',
      categorie: ReportCategorie.ELECTRONIQUE,
      date_evenement: daysAgo(2),
      heure_evenement: '19:15:00',
      adresse: 'Bab Mansour, Meknès',
      photos: [PHOTOS.iphone],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: sophie.id,
      type: ReportType.LOST,
      titre: 'Clés Renault avec porte-clés bleu',
      description:
        'Trousseau de clés Renault avec porte-clés bleu en forme de goutte. Perdu près de la médina après un café. 3 clés + badge parking.',
      categorie: ReportCategorie.CLES,
      date_evenement: daysAgo(1),
      heure_evenement: '09:45:00',
      adresse: 'Médina de Meknès',
      photos: [PHOTOS.keys],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: lucas.id,
      type: ReportType.FOUND,
      titre: 'Clés Renault porte-clés bleu trouvées',
      description:
        'Clés Renault retrouvées sur un banc, porte-clés bleu en goutte et badge parking attaché. Trouvé ce matin avenue Mohammed V.',
      categorie: ReportCategorie.CLES,
      date_evenement: daysAgo(1),
      heure_evenement: '10:20:00',
      adresse: 'Avenue Mohammed V, Meknès',
      photos: [PHOTOS.keys],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: emma.id,
      type: ReportType.LOST,
      titre: 'Sac Longchamp Le Pliage noir',
      description:
        'Sac Longchamp Le Pliage taille M, couleur noir. Contient un carnet Moleskine rouge et des écouteurs. Perdu gare de Meknès hall principal.',
      categorie: ReportCategorie.SAC,
      date_evenement: daysAgo(3),
      heure_evenement: '17:00:00',
      adresse: 'Gare de Meknès',
      photos: [PHOTOS.bag],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: pierre.id,
      type: ReportType.FOUND,
      titre: 'Sac Longchamp noir trouvé',
      description:
        'Sac Longchamp noir Le Pliage trouvé près de la gare, avec carnet Moleskine rouge à l\'intérieur. Remis à l\'accueil puis récupéré.',
      categorie: ReportCategorie.SAC,
      date_evenement: daysAgo(3),
      heure_evenement: '17:40:00',
      adresse: 'Place de la Gare, Meknès',
      photos: [PHOTOS.bag],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: julien.id,
      type: ReportType.LOST,
      titre: 'Chat roux Minou disparu',
      description:
        'Chat roux nommé Minou, collier vert avec médaille "Minou". Très câlin, peut répondre à son nom. Disparu quartier Hamria.',
      categorie: ReportCategorie.ANIMAUX,
      date_evenement: daysAgo(4),
      heure_evenement: '22:00:00',
      adresse: 'Quartier Hamria, Meknès',
      photos: [PHOTOS.cat],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: camille.id,
      type: ReportType.FOUND,
      titre: 'Chat roux trouvé à Montmartre',
      description:
        'Chat roux trouvé ce matin près du bassin de l\'Aguedal, collier vert avec médaille gravée "Minou". Semble perdu, très affectueux.',
      categorie: ReportCategorie.ANIMAUX,
      date_evenement: daysAgo(3),
      heure_evenement: '08:30:00',
      adresse: 'Bassin de l\'Aguedal, Meknès',
      photos: [PHOTOS.cat],
      statut: ReportStatut.EN_ATTENTE,
    }),
    // --- Success story (resolved) ---
    reportRepo.create({
      user_id: marie.id,
      type: ReportType.LOST,
      titre: 'Portefeuille marron avec cartes',
      description:
        'Portefeuille cuir marron contenant carte bancaire, carte de transport et carte mutuelle. Perdu près de la place Administrative.',
      categorie: ReportCategorie.PAPIERS,
      date_evenement: daysAgo(10),
      heure_evenement: '14:00:00',
      adresse: 'Place Administrative, Meknès',
      photos: [PHOTOS.wallet],
      statut: ReportStatut.RESOLU,
    }),
    reportRepo.create({
      user_id: pierre.id,
      type: ReportType.FOUND,
      titre: 'Portefeuille marron trouvé République',
      description:
        'Portefeuille cuir marron trouvé sur un banc place Administrative. Cartes à l\'intérieur, propriétaire retrouvé via findit !',
      categorie: ReportCategorie.PAPIERS,
      date_evenement: daysAgo(10),
      heure_evenement: '15:30:00',
      adresse: 'Place Administrative, Meknès',
      photos: [PHOTOS.wallet],
      statut: ReportStatut.RENDU,
    }),
    // --- Extra feed variety ---
    reportRepo.create({
      user_id: marie.id,
      type: ReportType.LOST,
      titre: 'AirPods Pro 2ème génération',
      description:
        'Boîtier blanc AirPods Pro 2 avec gravure "M.D." sur le couvercle. Perdu au complexe Hériadine lors d\'une promenade en soirée.',
      categorie: ReportCategorie.ELECTRONIQUE,
      date_evenement: daysAgo(1),
      heure_evenement: '20:45:00',
      adresse: 'Complexe Hériadine, Meknès',
      photos: [PHOTOS.airpods],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: thomas.id,
      type: ReportType.FOUND,
      titre: 'Apple Watch Series 9',
      description:
        'Montre Apple Watch Series 9 bracelet sport bleu nuit, trouvée près du musée Dar Jamai. Écran verrouillé, en bon état.',
      categorie: ReportCategorie.ELECTRONIQUE,
      date_evenement: daysAgo(0),
      heure_evenement: '07:30:00',
      adresse: 'Musée Dar Jamai, Meknès',
      photos: [PHOTOS.watch],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: sophie.id,
      type: ReportType.LOST,
      titre: 'Passeport français perdu',
      description:
        'Passeport français au nom de Sophie Bernard, perdu près de l\'université Moulay Ismail. Urgent avant voyage.',
      categorie: ReportCategorie.PAPIERS,
      date_evenement: daysAgo(0),
      heure_evenement: '16:00:00',
      adresse: 'Université Moulay Ismail, Meknès',
      photos: [PHOTOS.passport],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: lucas.id,
      type: ReportType.FOUND,
      titre: 'Veste en jean Levi\'s bleue',
      description:
        'Veste en jean Levi\'s bleu foncé taille M, trouvée au souk sur une terrasse de café. Poche intérieure avec ticket de cinéma.',
      categorie: ReportCategorie.VETEMENTS,
      date_evenement: daysAgo(2),
      heure_evenement: '23:00:00',
      adresse: 'Souk El Hedim, Meknès',
      photos: [PHOTOS.jacket],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: emma.id,
      type: ReportType.LOST,
      titre: 'Bague de fiançailles or blanc',
      description:
        'Bague de fiançailles or blanc avec petit diamant, perdue au jardin Lahboul. Valeur sentimentale énorme.',
      categorie: ReportCategorie.BIJOUX,
      date_evenement: daysAgo(5),
      heure_evenement: '12:00:00',
      adresse: 'Jardin Lahboul, Meknès',
      photos: [PHOTOS.ring],
      statut: ReportStatut.EN_ATTENTE,
    }),
    reportRepo.create({
      user_id: camille.id,
      type: ReportType.FOUND,
      titre: 'Sac à dos North Face rouge',
      description:
        'Sac à dos The North Face rouge trouvé près du marché couvert. Contient des livres de droit et une gourde.',
      categorie: ReportCategorie.SAC,
      date_evenement: daysAgo(1),
      heure_evenement: '13:10:00',
      adresse: 'Marché couvert, Meknès',
      photos: [PHOTOS.bag],
      statut: ReportStatut.EN_ATTENTE,
    }),
  ]);

  const [
    lostIphone,
    foundIphone,
    lostKeys,
    foundKeys,
    lostBag,
    foundBag,
    lostCat,
    foundCat,
    lostWallet,
    foundWallet,
    lostAirpods,
    foundWatch,
    lostPassport,
    foundJacket,
    lostRing,
    foundBackpack,
  ] = reports;

  const locations: Array<[string, number, number]> = [
    [lostIphone.id, ...loc(0, 0)],
    [foundIphone.id, ...loc(0.003, 0.004)],
    [lostKeys.id, ...loc(-0.004, -0.003)],
    [foundKeys.id, ...loc(-0.005, -0.002)],
    [lostBag.id, ...loc(0.002, -0.007)],
    [foundBag.id, ...loc(0.004, -0.005)],
    [lostCat.id, ...loc(0.006, 0.006)],
    [foundCat.id, ...loc(0.008, 0.008)],
    [lostWallet.id, ...loc(-0.001, -0.001)],
    [foundWallet.id, ...loc(-0.002, -0.0015)],
    [lostAirpods.id, ...loc(-0.002, 0.003)],
    [foundWatch.id, ...loc(-0.003, -0.0005)],
    [lostPassport.id, ...loc(0.001, -0.004)],
    [foundJacket.id, ...loc(0.003, 0.002)],
    [lostRing.id, ...loc(-0.005, 0.004)],
    [foundBackpack.id, ...loc(0, -0.009)],
  ];

  for (const [reportId, lng, lat] of locations) {
    await setReportLocation(dataSource, reportId, lng, lat);
  }

  const matchRepo = dataSource.getRepository(Match);
  await matchRepo.save([
    matchRepo.create({
      report_lost_id: lostIphone.id,
      report_found_id: foundIphone.id,
      score: 0.812,
      notified: true,
    }),
    matchRepo.create({
      report_lost_id: lostKeys.id,
      report_found_id: foundKeys.id,
      score: 0.876,
      notified: true,
    }),
    matchRepo.create({
      report_lost_id: lostBag.id,
      report_found_id: foundBag.id,
      score: 0.791,
      notified: true,
    }),
    matchRepo.create({
      report_lost_id: lostCat.id,
      report_found_id: foundCat.id,
      score: 0.845,
      notified: true,
    }),
    matchRepo.create({
      report_lost_id: lostWallet.id,
      report_found_id: foundWallet.id,
      score: 0.903,
      notified: true,
    }),
  ]);

  const conversationRepo = dataSource.getRepository(Conversation);

  const iphoneConversation = await conversationRepo.save(
    conversationRepo.create({
      report_lost_id: lostIphone.id,
      report_found_id: foundIphone.id,
      initiator_id: marie.id,
      receiver_id: thomas.id,
      statut: ConversationStatut.ACTIVE,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
    }),
  );

  const keysConversation = await conversationRepo.save(
    conversationRepo.create({
      report_lost_id: lostKeys.id,
      report_found_id: foundKeys.id,
      initiator_id: sophie.id,
      receiver_id: lucas.id,
      statut: ConversationStatut.ACTIVE,
      expires_at: new Date(Date.now() + 60 * 60 * 60 * 1000),
    }),
  );

  const bagConversation = await conversationRepo.save(
    conversationRepo.create({
      report_lost_id: lostBag.id,
      report_found_id: foundBag.id,
      initiator_id: emma.id,
      receiver_id: pierre.id,
      statut: ConversationStatut.EN_ATTENTE,
      expires_at: new Date(Date.now() + 36 * 60 * 60 * 1000),
    }),
  );

  const walletConversation = await conversationRepo.save(
    conversationRepo.create({
      report_lost_id: lostWallet.id,
      report_found_id: foundWallet.id,
      initiator_id: marie.id,
      receiver_id: pierre.id,
      statut: ConversationStatut.LECTURE_SEULE,
      expires_at: hoursAgo(24),
    }),
  );

  const messageRepo = dataSource.getRepository(Message);
  await messageRepo.save([
    messageRepo.create({
      conversation_id: iphoneConversation.id,
      sender_id: marie.id,
      contenu:
        'Bonjour Thomas ! Votre annonce correspond exactement à mon iPhone. La coque transparente avec le sticker Tour Eiffel est bien la mienne.',
      is_read: true,
      created_at: hoursAgo(20),
    }),
    messageRepo.create({
      conversation_id: iphoneConversation.id,
      sender_id: thomas.id,
      contenu:
        'Salut Marie ! Oui c\'est bien un iPhone 15 Pro noir. On peut se retrouver demain devant Bab Mansour pour vérifier ?',
      is_read: true,
      created_at: hoursAgo(19),
    }),
    messageRepo.create({
      conversation_id: iphoneConversation.id,
      sender_id: marie.id,
      contenu:
        'Parfait ! Je pourrai déverrouiller avec Face ID sur place. Merci infiniment 🙏',
      is_read: false,
      created_at: hoursAgo(18),
    }),
    messageRepo.create({
      conversation_id: keysConversation.id,
      sender_id: sophie.id,
      contenu:
        'Bonjour Lucas, j\'ai vu que vous avez trouvé des clés Renault avec un porte-clés bleu — c\'est exactement ma description !',
      is_read: true,
      created_at: hoursAgo(6),
    }),
    messageRepo.create({
      conversation_id: keysConversation.id,
      sender_id: lucas.id,
      contenu:
        'Bonjour Lucas ! Le badge parking est toujours attaché. On se voit à la médina ce soir ?',
      is_read: true,
      created_at: hoursAgo(5),
    }),
    messageRepo.create({
      conversation_id: keysConversation.id,
      sender_id: sophie.id,
      contenu: 'Oui, 19h devant la fontaine d\'El Hedim ? Je vous enverrai une photo du porte-clés.',
      is_read: false,
      created_at: hoursAgo(4),
    }),
    messageRepo.create({
      conversation_id: bagConversation.id,
      sender_id: emma.id,
      contenu:
        'Bonjour Pierre, mon sac Longchamp noir avec le carnet Moleskine rouge — est-ce le vôtre ?',
      is_read: false,
      created_at: hoursAgo(2),
    }),
    messageRepo.create({
      conversation_id: walletConversation.id,
      sender_id: marie.id,
      contenu: 'Bonjour, je pense que c\'est mon portefeuille marron !',
      is_read: true,
      created_at: hoursAgo(200),
    }),
    messageRepo.create({
      conversation_id: walletConversation.id,
      sender_id: pierre.id,
      contenu:
        'Oui, les cartes correspondent. On s\'est retrouvés place Administrative, tout est rentré dans l\'ordre !',
      is_read: true,
      created_at: hoursAgo(198),
    }),
    messageRepo.create({
      conversation_id: walletConversation.id,
      sender_id: marie.id,
      contenu: 'Merci encore Pierre, vous êtes un ange ! ⭐',
      is_read: true,
      created_at: hoursAgo(197),
    }),
  ]);

  const reviewRepo = dataSource.getRepository(Review);
  await reviewRepo.save([
    reviewRepo.create({
      reviewer_id: marie.id,
      reviewed_id: pierre.id,
      conversation_id: walletConversation.id,
      note: 5,
      commentaire:
        'Pierre a été réactif, honnête et arrangeant. Portefeuille récupéré en moins de 24h !',
      created_at: hoursAgo(196),
    }),
    reviewRepo.create({
      reviewer_id: pierre.id,
      reviewed_id: marie.id,
      conversation_id: walletConversation.id,
      note: 5,
      commentaire: 'Échange simple et rapide, Marie était très sympa.',
      created_at: hoursAgo(195),
    }),
    reviewRepo.create({
      reviewer_id: thomas.id,
      reviewed_id: marie.id,
      conversation_id: iphoneConversation.id,
      note: 5,
      commentaire: 'Très polie, rendez-vous confirmé sans souci.',
      created_at: hoursAgo(17),
    }),
    reviewRepo.create({
      reviewer_id: lucas.id,
      reviewed_id: sophie.id,
      conversation_id: keysConversation.id,
      note: 4,
      commentaire: 'Bonne communication, en attente de la rencontre.',
      created_at: hoursAgo(3),
    }),
    reviewRepo.create({
      reviewer_id: sophie.id,
      reviewed_id: lucas.id,
      conversation_id: keysConversation.id,
      note: 5,
      commentaire: 'Lucas a répondu en quelques minutes, top !',
      created_at: hoursAgo(3),
    }),
  ]);

  const reportCounts = new Map<string, number>();
  for (const report of reports) {
    reportCounts.set(
      report.user_id,
      (reportCounts.get(report.user_id) ?? 0) + 1,
    );
  }

  for (const user of users) {
    user.reports_count = reportCounts.get(user.id) ?? 0;
  }
  await userRepo.save(users);

  await dataSource.destroy();

  console.log('\n✅ Database seeded successfully!\n');
  console.log('Demo accounts (password for all):', DEMO_PASSWORD);
  console.log('─────────────────────────────────────────');
  for (const user of users) {
    console.log(`  ${user.email.padEnd(28)} → ${user.nom}`);
  }
  console.log('─────────────────────────────────────────');
  console.log(`\n${reports.length} reports · 5 matches · 4 conversations · 10 messages · 5 reviews`);
  console.log(`\nAll items centered near ${SHOWCASE_CENTER.lat}, ${SHOWCASE_CENTER.lng} (Meknès)\n`);
  console.log('\nTip: log in as demo@findit.app to explore matches and active chats.\n');
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
