import ParticulierClient from "./ParticulierClient";

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BailBot",
  description:
    "Outil d'analyse de dossiers locataires pour propriétaires bailleurs. Score de solvabilité BailScore™, vérification Visale, génération bail loi ALUR.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://bailbot.fr/particulier",
  offers: {
    "@type": "Offer",
    price: "4.90",
    priceCurrency: "EUR",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "127",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "C'est quoi la différence avec DossierFacile ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DossierFacile est un outil pour les locataires — il leur permet de constituer leur dossier. BailBot est pour vous, le propriétaire bailleur — il analyse les dossiers que vous recevez et génère votre bail loi ALUR automatiquement.",
      },
    },
    {
      "@type": "Question",
      name: "Mes données sont-elles sécurisées ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "L'analyse se fait entièrement dans votre navigateur. Aucun document ne transite par nos serveurs. Vos données et celles de vos locataires restent 100% sur votre ordinateur.",
      },
    },
    {
      "@type": "Question",
      name: "Est-ce que ça marche avec Visale ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. BailBot vérifie automatiquement si votre locataire est éligible à Visale (garantie gratuite d'Action Logement). Vous obtenez la réponse directement dans le dossier locataire.",
      },
    },
    {
      "@type": "Question",
      name: "Le bail généré est-il légalement valable ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le bail suit le modèle légal loi ALUR. Il doit être signé par les deux parties pour être valable. Nous recommandons une relecture par un professionnel juridique en cas de doute.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je passer au plan Pro plus tard ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, à tout moment depuis votre compte. Vos dossiers existants sont conservés et vous bénéficiez immédiatement des fonctionnalités Pro.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://bailbot.fr" },
    { "@type": "ListItem", position: 2, name: "Particulier", item: "https://bailbot.fr/particulier" },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Comment analyser un dossier locataire avec BailBot",
  description:
    "Sélectionnez votre locataire idéal en 3 étapes avec BailBot en tant que propriétaire bailleur.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Recevez les documents",
      text: "Le candidat locataire vous envoie ses pièces par email : CNI, bulletins de paie, avis d'imposition, RIB.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Déposez tout dans BailBot",
      text: "Drag & drop sur BailBot — il trie automatiquement chaque document et extrait toutes les informations.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Obtenez le BailScore et le bail",
      text: "Solvabilité calculée via le BailScore™, éligibilité Visale vérifiée, bail PDF conforme loi ALUR généré en 1 clic.",
    },
  ],
};

export default function ParticulierPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <ParticulierClient />
    </>
  );
}
