// Conditions d'utilisation, confidentialité et mentions légales, shown in src/app/legal.
import { fmt, fmtInt } from '../lib/format';
import { DEFAULT_COMMISSION, DELIVERY } from './catalog';

/**
 * Who publishes Pimou. To fill in once the business exists (entreprise individuelle or société):
 * an empty value shows "[à compléter]" on the pages.
 */
export const LEGAL = {
  /** Shown on the pages. Change it with TERMS_VERSION when the texts change in a way that matters. */
  updated: '29 octobre 2026',
  /** e.g. "Anaïs Martin EI" or "Pimou SAS". */
  name: '',
  /** e.g. "Entreprise individuelle" or "SAS au capital de 1 000 €". */
  form: '',
  address: '',
  /** SIREN, or RCS number for a société. */
  siren: '',
  /** "Non applicable (TVA non applicable, article 293 B du CGI)" under the VAT threshold. */
  vat: '',
  phone: '',
  director: '',
  email: 'bonjour@pimou.fr',
  /** Médiateur de la consommation Pimou signs up with (mandatory for a business serving consumers). */
  mediator: { name: '', address: '', url: '' },
  /** Where the Supabase project lives (Project Settings → General → Region), e.g. "en Irlande (Union européenne)". */
  dataRegion: '',
};

/**
 * Version recorded each time a parent accepts the CGU and the privacy policy (supabase/schema-8-cgu.sql).
 * A new value asks every parent to accept again at their next visit.
 */
export const TERMS_VERSION = '2026-10-29';

/** Above this, in a calendar year, the platform reports the seller's sales to the tax office (DAC7). */
export const TAX_REPORT = { sales: 30, amount: 2000 };

export const TODO = '[à compléter]';
const v = (s: string) => s || TODO;

/** A paragraph, or a bulleted list. Web addresses and e-mails in the text become links. */
export type LegalBlock = string | string[];
export type LegalSection = { title: string; body: LegalBlock[] };
export type LegalId = 'cgu' | 'confidentialite' | 'mentions';
export type LegalDoc = { title: string; short: string; intro: string; sections: LegalSection[] };

const price = (id: string) => fmt(DELIVERY.find((d) => d.id === id)!.price);
const publisher = () => `${v(LEGAL.name)}, ${v(LEGAL.form)}, ${v(LEGAL.address)}`;

const cgu = (): LegalDoc => ({
  title: "Conditions générales d'utilisation",
  short: "Conditions d'utilisation",
  intro: `Ces conditions s'appliquent à toute personne qui utilise Pimou, sur le site ou dans l'application. En créant ton compte, tu les acceptes. Version du ${LEGAL.updated}.`,
  sections: [
    { title: '1. Pimou, c\'est quoi ?', body: [
      `Pimou est un service qui met en relation des parents pour vendre et acheter, entre particuliers, des vêtements, chaussures, chaussettes et collants d'enfants d'occasion. Pimou est édité par ${publisher()} (voir les mentions légales).`,
      "Pimou est un intermédiaire : la vente est conclue directement entre le vendeur et l'acheteur. Pimou n'est ni le vendeur ni le propriétaire des articles, et ne les vérifie pas un par un.",
    ] },
    { title: '2. Ton compte', body: [
      "Pour acheter, vendre ou écrire à un parent, il faut un compte. Tu dois avoir au moins 18 ans, donner des informations exactes et les tenir à jour. Ton acceptation de ces conditions est enregistrée (version, date et heure).",
      "Ton compte est personnel. Garde ton mot de passe pour toi : tout ce qui est fait depuis ton compte est réputé fait par toi. Si tu penses qu'il a été utilisé par quelqu'un d'autre, écris-nous tout de suite.",
      "Pimou est réservé aux particuliers qui vendent leurs propres affaires. Acheter pour revendre ou vendre à titre professionnel n'est pas autorisé.",
    ] },
    { title: '3. Vente entre particuliers : ce que ça change', body: [
      "Les vendeurs sur Pimou sont des particuliers. Le droit de la consommation ne s'applique pas aux ventes entre particuliers : il n'y a pas de droit de rétractation de 14 jours ni de garantie légale de conformité.",
      "L'acheteur reste protégé par la garantie des vices cachés (articles 1641 et suivants du Code civil) et par la protection Pimou : le vendeur n'est payé qu'une fois que l'acheteur a confirmé avoir bien reçu l'article (article 8).",
    ] },
    { title: '4. Les annonces', body: [
      'Sur Pimou, on vend des vêtements, chaussures, chaussettes et collants pour enfants. En publiant une annonce, le vendeur s\'engage à :',
      [
        "être propriétaire de l'article et pouvoir le vendre ;",
        "publier de vraies photos de l'article, et une description honnête qui signale les défauts ;",
        'indiquer le bon état, selon le guide des états de Pimou, et la bonne taille ou pointure ;',
        "ne cocher « lavé et plié » que si c'est vrai ;",
        "retirer l'annonce dès que l'article n'est plus disponible.",
      ],
      'Sont interdits : les contrefaçons, les articles dangereux ou rappelés (voir rappel.conso.gouv.fr), les articles sales ou abîmés présentés comme en bon état, et tout ce qui n\'est pas un vêtement, une paire de chaussures ou de chaussettes pour enfant.',
    ] },
    { title: '5. Comment les annonces sont classées', body: [
      "Les annonces apparaissent de la plus récente à la plus ancienne. Sur l'accueil, Pimou montre celles qui correspondent au passeport de l'enfant choisi (taille, pointure, fille ou garçon) et met en premier celles dans ses couleurs préférées. Dans la recherche, tu choisis tes propres filtres.",
      "Personne ne peut payer pour être mieux placé : Pimou ne vend pas de mise en avant.",
    ] },
    { title: '6. Prix et offres', body: [
      "Le vendeur fixe son prix. L'acheteur peut faire une offre dans la messagerie ; le vendeur l'accepte, la refuse ou propose un autre prix. Un prix accepté devient le prix à payer pour cet acheteur.",
      "Une offre acceptée n'oblige personne tant que le paiement n'est pas fait : la vente est conclue au moment où le paiement est validé.",
    ] },
    { title: '7. Paiement et livraison', body: [
      `L'acheteur paie le prix de l'article et les frais de livraison : ${price('relais')} en point relais, ${price('domicile')} à domicile, gratuit en remise en main propre. La protection acheteur est offerte.`,
      "Le paiement se fait uniquement sur Pimou, par carte bancaire, Apple Pay ou Google Pay, sur la page sécurisée de Stripe, notre prestataire de paiement agréé. Pimou ne voit jamais ton numéro de carte. Un paiement fait en dehors de Pimou (virement, espèces…) n'est pas protégé : ne l'accepte pas et ne le propose pas.",
      "Si l'article a été acheté par quelqu'un d'autre juste avant toi, la vente est annulée et tu es remboursé·e automatiquement et en totalité.",
      "Le vendeur expédie l'article dans les 3 jours qui suivent le paiement, puis l'indique dans l'appli. Pour une remise en main propre, les deux parents fixent le rendez-vous dans la messagerie, dans un lieu public.",
    ] },
    { title: '8. Réception et protection acheteur', body: [
      "L'argent reste bloqué chez Stripe jusqu'à ce que l'acheteur confirme dans l'appli avoir bien reçu l'article. Il est alors versé au vendeur. L'acheteur ne confirme que lorsqu'il a vérifié l'article : une fois la réception confirmée, la vente est définitive.",
      `Un problème (colis jamais arrivé, article très différent de l'annonce) ? Ne confirme pas la réception et écris-nous à ${LEGAL.email} avec des photos. Pimou étudie la situation avec les deux parents et décide, selon les éléments fournis, de rembourser l'acheteur (après retour de l'article si besoin) ou de payer le vendeur.`,
      "Si le vendeur n'a pas expédié l'article 7 jours après le paiement, l'acheteur peut demander l'annulation et le remboursement. Si l'acheteur ne confirme pas la réception et ne signale aucun problème 14 jours après l'expédition, Pimou peut confirmer la réception à sa place et payer le vendeur.",
    ] },
    { title: '9. Commission et versements au vendeur', body: [
      `Publier une annonce est gratuit. Quand un article est vendu, Pimou prend une commission de ${DEFAULT_COMMISSION} % du prix de vente (frais de livraison non compris). Elle est retenue sur la somme versée au vendeur. Le montant que tu recevras est affiché avant que tu publies ton annonce.`,
      "Pour recevoir son argent, le vendeur active ses paiements : Stripe lui demande son identité et son IBAN, comme la loi l'impose. L'argent arrive sur son compte bancaire en quelques jours ouvrés après la confirmation de réception.",
      "La commission correspond à un service entièrement fourni au moment de la vente : tu acceptes qu'il soit exécuté tout de suite, et tu ne peux donc plus te rétracter sur cette commission une fois la vente faite (article L221-28 du Code de la consommation).",
    ] },
    { title: '10. Impôts et URSSAF', body: [
      "Vendre ses propres affaires d'occasion n'est en principe pas imposable. En revanche, acheter pour revendre ou vendre très régulièrement peut être une activité commerciale, à déclarer aux impôts et à l'URSSAF. Pour savoir ce qui s'applique à toi : impots.gouv.fr et urssaf.fr.",
      `Comme toutes les plateformes, Pimou doit transmettre chaque année à l'administration fiscale l'identité et le montant des ventes des vendeurs qui ont fait au moins ${TAX_REPORT.sales} ventes ou ${fmtInt(TAX_REPORT.amount)} € de ventes dans l'année. Ces vendeurs sont prévenus dans l'appli et reçoivent une copie de ces informations au plus tard le 31 janvier de l'année suivante.`,
    ] },
    { title: '11. Les avis', body: [
      "Seul l'acheteur d'une commande reçue peut laisser un avis sur le vendeur, une fois par commande : chaque avis correspond donc à un vrai achat. Il comprend une note de 1 à 5 étoiles, un commentaire facultatif et, si l'annonce le promettait, la confirmation « lavé et plié ». L'acheteur peut le modifier ensuite. Personne n'est payé pour laisser un avis.",
      "Les avis sont affichés du plus récent au plus ancien, avec leur date, et restent visibles tant que le compte du vendeur existe. Pimou ne modifie pas les avis. Un avis insultant, hors sujet ou qui contient des informations personnelles peut être retiré : le vendeur comme l'acheteur peuvent nous le signaler, et l'auteur est prévenu si son avis est retiré.",
    ] },
    { title: '12. La messagerie et le respect', body: [
      "La messagerie sert à parler des articles, des offres et des remises en main propre. Restons polis et bienveillants. Sont interdits : les insultes, le harcèlement, les fausses annonces, le spam, les arnaques, le partage des informations personnelles de quelqu'un d'autre et les propositions de paiement en dehors de Pimou.",
    ] },
    { title: '13. Signaler un contenu', body: [
      `Une annonce, un message ou un avis te semble illégal ou contraire à ces conditions ? Signale-le avec le bouton « Signaler cette annonce » ou en écrivant à ${LEGAL.email}. Indique où se trouve le contenu, ce qui pose problème, et ton nom et ton e-mail.`,
      "Pimou traite chaque signalement rapidement et te répond. Si un contenu est retiré ou un compte suspendu, la personne concernée en est informée avec les raisons de la décision et peut la contester en nous répondant, puis auprès du médiateur ou d'un tribunal.",
    ] },
    { title: '14. Suspension et fermeture du compte', body: [
      `Tu peux fermer ton compte à tout moment en écrivant à ${LEGAL.email}. Les commandes en cours sont d'abord terminées.`,
      "Pimou peut suspendre ou fermer un compte en cas de manquement grave à ces conditions (fraude, article interdit, insultes répétées…), après t'avoir prévenu·e et expliqué pourquoi, sauf urgence.",
    ] },
    { title: '15. Responsabilité', body: [
      "Pimou fait de son mieux pour que le service fonctionne bien et sans interruption, sans pouvoir le garantir à tout moment. Comme intermédiaire, Pimou n'est pas responsable de la qualité, de l'état ou de la conformité des articles, ni de ce que les parents écrivent ou font. Pimou reste responsable de ses propres manquements.",
    ] },
    { title: '16. Tes photos et tes textes', body: [
      "Tes photos et tes textes restent à toi. En les publiant, tu autorises Pimou, gratuitement et pour la durée de ton annonce, à les afficher, les redimensionner et les montrer aux autres parents sur le site et l'application. Ne publie que des photos que tu as prises toi-même.",
      "Le nom Pimou, son logo et son design appartiennent à son éditeur et ne peuvent pas être réutilisés sans accord.",
    ] },
    { title: '17. Données personnelles', body: [
      'Ce que Pimou fait de tes données est expliqué dans la politique de confidentialité.',
    ] },
    { title: '18. Modification de ces conditions', body: [
      "Pimou peut faire évoluer ces conditions. Tu seras prévenu·e au moins 15 jours avant que les changements importants s'appliquent, et l'appli te demandera de les accepter à nouveau. Si tu n'es pas d'accord, tu peux fermer ton compte.",
    ] },
    { title: '19. Litiges et médiation', body: [
      `Ces conditions sont soumises au droit français. En cas de souci avec Pimou, écris-nous d'abord à ${LEGAL.email} : on cherchera une solution ensemble.`,
      `Si tu n'es pas satisfait·e de notre réponse, tu peux saisir gratuitement le médiateur de la consommation de Pimou : ${v(LEGAL.mediator.name)}, ${v(LEGAL.mediator.address)}, ${v(LEGAL.mediator.url)}.`,
      "Un désaccord entre deux parents se règle d'abord entre eux, avec l'aide de Pimou si besoin, puis devant le tribunal compétent.",
    ] },
  ],
});

const confidentialite = (): LegalDoc => ({
  title: 'Politique de confidentialité',
  short: 'Confidentialité',
  intro: `Ce que Pimou fait de tes données personnelles, et tes droits. On collecte le moins de choses possible et on ne vend jamais tes données. Version du ${LEGAL.updated}.`,
  sections: [
    { title: '1. Qui est responsable de tes données ?', body: [
      `${publisher()}. Pour toute question sur tes données : ${LEGAL.email}.`,
    ] },
    { title: '2. Les données que Pimou utilise', body: [
      [
        'Ton compte : prénom, nom, e-mail, téléphone si tu le donnes, adresse postale, et ton mot de passe (enregistré chiffré : personne chez Pimou ne peut le lire).',
        "Les passeports de tes enfants, si tu en crées : prénom ou surnom, date de naissance, fille ou garçon, taille, pointure, couleurs et styles préférés, notes. Tu choisis ce que tu y mets : un surnom suffit.",
        'Tes annonces : photos, descriptions, prix, et tes favoris.',
        'Tes messages et tes offres avec les autres parents.',
        'Tes commandes et tes avis.',
        "La trace de ton acceptation des conditions d'utilisation et de cette politique : la version acceptée, la date et l'heure, et l'appareil utilisé (navigateur ou téléphone).",
        "Les paiements : c'est Stripe qui reçoit ta carte bancaire, et l'identité et l'IBAN des vendeurs. Pimou n'a jamais accès à ton numéro de carte ni à tes papiers ; Pimou sait seulement si le paiement a réussi et si les versements d'un vendeur sont activés.",
        "Pour les vendeurs concernés par la déclaration annuelle aux impôts (au moins 30 ventes ou plus de 2 000 € par an) : les informations que la loi impose de transmettre (identité, adresse, date de naissance, numéro fiscal, montant des ventes).",
      ],
    ] },
    { title: '3. Ce que les autres parents voient', body: [
      "Ton prénom et l'initiale de ton nom, ta ville et ton code postal (pour estimer la distance pour une remise en main propre), ton année d'inscription, tes annonces, tes avis et ton nombre de ventes.",
      "Ton adresse de livraison n'est communiquée qu'au vendeur de ta commande, pour un envoi à domicile. Ton e-mail, ton téléphone et les passeports de tes enfants ne sont jamais montrés aux autres.",
    ] },
    { title: '4. Pourquoi Pimou les utilise', body: [
      [
        "Faire fonctionner le service que tu demandes : ton compte, tes annonces, la messagerie, les commandes, les paiements, les e-mails sur tes commandes, les passeports et l'accueil à la taille de ton enfant. C'est nécessaire au contrat qui nous lie (les CGU).",
        'Assurer la sécurité, éviter les fraudes et traiter les signalements : c\'est notre intérêt légitime, et celui de tous les parents.',
        "Pouvoir prouver que tu as accepté les conditions, en cas de litige : c'est aussi notre intérêt légitime.",
        'Respecter nos obligations légales : comptabilité, déclarations fiscales, réponses aux autorités.',
      ],
      "Pimou n'envoie pas de publicité, ne revend aucune donnée et n'utilise aucun outil de publicité ou de mesure d'audience.",
      "Pimou n'utilise pas tes données avec une intelligence artificielle, ne s'en sert pas pour en entraîner une, et ne prend aucune décision te concernant de façon automatique. Seul Stripe, notre prestataire de paiement, utilise ses propres outils automatiques pour repérer les paiements frauduleux.",
    ] },
    { title: '5. Qui reçoit tes données', body: [
      'Seulement les prestataires qui font tourner Pimou, chacun pour sa partie et sous contrat :',
      [
        `Supabase (comptes, base de données et photos), avec des serveurs situés ${v(LEGAL.dataRegion)} ;`,
        "Stripe (paiements et vérification d'identité des vendeurs), Stripe Payments Europe en Irlande ;",
        'Resend (envoi des e-mails), avec des serveurs d\'envoi en Irlande ;',
        'GitHub (hébergement du site web).',
      ],
      "Certains de ces prestataires sont des sociétés américaines. Quand des données quittent l'Union européenne, ce transfert est encadré par les garanties prévues par le RGPD (décision d'adéquation de la Commission européenne ou clauses contractuelles types).",
      "L'administration fiscale reçoit les informations que la loi impose (voir l'article 2). Et bien sûr, le vendeur ou l'acheteur d'une commande reçoit ce qui est nécessaire pour la mener à bien.",
    ] },
    { title: '6. Combien de temps', body: [
      [
        'Ton compte, tes passeports et tes annonces : tant que ton compte est ouvert. Ils sont supprimés quand tu fermes ton compte, ou après 3 ans sans connexion.',
        "Tes messages : tant que ton compte est ouvert, et jusqu'à 1 an après ta dernière commande, en cas de litige.",
        'Les avis : tant que le compte du vendeur existe.',
        'Les commandes et les données de facturation : 10 ans, comme la loi l\'impose pour la comptabilité.',
        'Les informations transmises aux impôts : 10 ans.',
        "La trace de ton acceptation des conditions : 5 ans après la fermeture de ton compte, le temps pendant lequel un litige reste possible.",
      ],
    ] },
    { title: '7. Sur ton téléphone ou ton navigateur', body: [
      "Pimou garde sur ton appareil tes réglages (affichage, taille du texte), tes passeports, ton panier et ta session de connexion. C'est indispensable au fonctionnement de l'appli : il n'y a pas de cookie de publicité ni de traceur, donc pas de bandeau à accepter. Quand tu te déconnectes, tes informations personnelles sont effacées de l'appareil.",
    ] },
    { title: '8. Tes droits', body: [
      "Tu peux à tout moment accéder à tes données, les corriger, les faire supprimer, en limiter l'utilisation, t'opposer à certaines utilisations, les récupérer dans un format lisible, et dire ce qu'elles deviennent après ton décès.",
      `Tu peux déjà corriger ton compte et tes passeports dans l'appli (Profil). Pour le reste, ou pour supprimer ton compte, écris à ${LEGAL.email} : on te répond sous un mois au plus tard.`,
      "Si tu penses que tes droits ne sont pas respectés, tu peux faire une réclamation auprès de la CNIL : www.cnil.fr.",
    ] },
    { title: '9. Sécurité', body: [
      "Les échanges sont chiffrés (https), les mots de passe aussi, et chaque parent n'a accès qu'à ses propres données : ses messages, ses commandes, ses passeports.",
    ] },
    { title: '10. Les enfants', body: [
      "Pimou est réservé aux adultes. Les informations sur les enfants sont saisies par leurs parents, uniquement pour leur proposer les bonnes tailles, et ne sont jamais montrées aux autres.",
    ] },
    { title: '11. Changements', body: [
      'Si cette politique change de façon importante, tu seras prévenu·e dans l\'appli ou par e-mail.',
    ] },
  ],
});

const mentions = (): LegalDoc => ({
  title: 'Mentions légales',
  short: 'Mentions légales',
  intro: `Les informations sur l'éditeur et les hébergeurs de Pimou. Mises à jour le ${LEGAL.updated}.`,
  sections: [
    { title: 'Éditeur', body: [
      [
        `Nom : ${v(LEGAL.name)}`,
        `Statut : ${v(LEGAL.form)}`,
        `Adresse : ${v(LEGAL.address)}`,
        `SIREN : ${v(LEGAL.siren)}`,
        `TVA : ${v(LEGAL.vat)}`,
        `Téléphone : ${v(LEGAL.phone)}`,
        `E-mail : ${LEGAL.email}`,
      ],
    ] },
    { title: 'Directeur ou directrice de la publication', body: [v(LEGAL.director)] },
    { title: 'Hébergement', body: [
      [
        'Site web : GitHub, Inc. (GitHub Pages), 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis, github.com.',
        `Données de l'application : Supabase, Inc., supabase.com, serveurs situés ${v(LEGAL.dataRegion)}.`,
      ],
    ] },
    { title: 'Paiements', body: [
      "Stripe Payments Europe, Limited, 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irlande, établissement agréé par la Banque centrale d'Irlande, stripe.com.",
    ] },
    { title: 'Propriété intellectuelle', body: [
      "Le nom Pimou, son logo, ses illustrations et son design sont protégés. Les photos et les textes des annonces appartiennent aux parents qui les ont publiés.",
    ] },
    { title: 'Intelligence artificielle', body: [
      "Pimou a été conçu et développé avec l'aide d'outils d'intelligence artificielle.",
      "L'application, elle, n'utilise pas d'intelligence artificielle avec toi : il n'y a pas de robot de discussion (les messages viennent toujours de vrais parents), et Pimou ne s'en sert ni pour classer les annonces, ni pour prendre des décisions te concernant, ni pour analyser tes données.",
      "Si Pimou ajoute un jour une fonction qui utilise l'intelligence artificielle (par exemple une aide pour rédiger une annonce), ce sera indiqué clairement là où elle est utilisée, comme le prévoit le règlement européen sur l'intelligence artificielle.",
    ] },
    { title: 'Contact et signalement', body: [
      `Pour toute question ou pour signaler un contenu : ${LEGAL.email}.`,
    ] },
  ],
});

export const LEGAL_DOCS: Record<LegalId, () => LegalDoc> = { cgu, confidentialite, mentions };
export const LEGAL_IDS = Object.keys(LEGAL_DOCS) as LegalId[];
