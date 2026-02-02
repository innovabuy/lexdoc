import React from 'react';
import { ArrowLeft, Shield, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PrivacyPolicyPageProps {
  cabinetName?: string;
  cabinetAddress?: string;
  cabinetEmail?: string;
  dpoEmail?: string;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  cabinetName = '[NOM DU CABINET]',
  cabinetAddress = '[ADRESSE DU CABINET]',
  cabinetEmail = 'contact@cabinet.fr',
  dpoEmail = 'dpo@cabinet.fr',
}) => {
  const lastUpdated = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-primary-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-100 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <div className="flex items-center gap-4">
            <Shield className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Politique de confidentialite</h1>
              <p className="text-primary-100 mt-1">
                Derniere mise a jour : {lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Responsable du traitement
            </h2>
            <p className="text-gray-600">
              Le cabinet <strong>{cabinetName}</strong>, situe {cabinetAddress},
              est responsable du traitement de vos donnees personnelles
              collectees via cette plateforme.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Donnees collectees
            </h2>
            <p className="text-gray-600 mb-4">
              Nous collectons les categories de donnees suivantes :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Donnees d'identification :</strong> nom, prenom, civilite
              </li>
              <li>
                <strong>Coordonnees :</strong> email, telephone, adresse postale
              </li>
              <li>
                <strong>Donnees professionnelles :</strong> entreprise, SIRET,
                fonction (si applicable)
              </li>
              <li>
                <strong>Donnees relatives au dossier :</strong> informations
                necessaires a la gestion de votre affaire juridique
              </li>
              <li>
                <strong>Donnees de connexion :</strong> adresse IP, logs de
                connexion
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Finalites du traitement
            </h2>
            <p className="text-gray-600 mb-4">
              Vos donnees sont traitees pour les finalites suivantes :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>La gestion et le suivi de votre dossier juridique</li>
              <li>L'execution de notre prestation d'avocat</li>
              <li>La communication relative a votre dossier</li>
              <li>Le respect de nos obligations legales et deontologiques</li>
              <li>L'amelioration de nos services</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Base legale du traitement
            </h2>
            <p className="text-gray-600">
              Le traitement de vos donnees repose sur :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
              <li>
                <strong>L'execution du contrat</strong> de prestation juridique
                (article 6.1.b RGPD)
              </li>
              <li>
                <strong>Le respect de nos obligations legales</strong> en tant
                qu'avocat (article 6.1.c RGPD)
              </li>
              <li>
                <strong>Votre consentement</strong> pour certains traitements
                specifiques (article 6.1.a RGPD)
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Destinataires des donnees
            </h2>
            <p className="text-gray-600 mb-4">
              Vos donnees sont accessibles uniquement a :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Votre avocat en charge du dossier</li>
              <li>Les collaborateurs habilites du cabinet</li>
              <li>
                Nos prestataires techniques (hebergement securise en France)
              </li>
              <li>Les autorites judiciaires sur requisition legale</li>
            </ul>
            <p className="text-gray-600 mt-4">
              <strong>Aucun transfert</strong> de vos donnees n'est effectue en
              dehors de l'Union Europeenne.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Duree de conservation
            </h2>
            <p className="text-gray-600">
              Conformement a la reglementation applicable aux avocats, vos
              donnees sont conservees pendant{' '}
              <strong>10 ans (dix ans)</strong> a compter de la fin de notre
              prestation, correspondant a la prescription legale des actes
              d'avocat.
            </p>
            <p className="text-gray-600 mt-4">
              A l'issue de cette periode, vos donnees sont anonymisees ou
              supprimees de maniere securisee.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Vos droits
            </h2>
            <p className="text-gray-600 mb-4">
              Conformement au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Droit d'acces (art. 15) :</strong> obtenir une copie de
                vos donnees personnelles
              </li>
              <li>
                <strong>Droit de rectification (art. 16) :</strong> corriger vos
                donnees inexactes ou incompletes
              </li>
              <li>
                <strong>Droit a l'effacement (art. 17) :</strong> supprimer vos
                donnees sous certaines conditions
              </li>
              <li>
                <strong>Droit a la portabilite (art. 20) :</strong> recuperer
                vos donnees dans un format lisible
              </li>
              <li>
                <strong>Droit d'opposition (art. 21) :</strong> vous opposer au
                traitement de vos donnees
              </li>
              <li>
                <strong>Droit a la limitation (art. 18) :</strong> limiter le
                traitement de vos donnees
              </li>
            </ul>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-6">
              <p className="text-primary-800">
                <strong>Pour exercer vos droits :</strong>
                <br />
                Utilisez notre{' '}
                <Link
                  to="/rgpd"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  portail RGPD en ligne
                </Link>{' '}
                ou contactez-nous a : <strong>{cabinetEmail}</strong>
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Securite des donnees
            </h2>
            <p className="text-gray-600 mb-4">
              Nous mettons en oeuvre des mesures techniques et organisationnelles
              appropriees pour proteger vos donnees :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Chiffrement des donnees en transit (SSL/TLS)</li>
              <li>Chiffrement des donnees au repos</li>
              <li>Hebergement securise en France (certifie ISO 27001)</li>
              <li>Acces restreint et authentification forte</li>
              <li>Sauvegardes regulieres et chiffrees</li>
              <li>Journalisation des acces</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Cookies
            </h2>
            <p className="text-gray-600">
              Cette plateforme utilise uniquement des cookies techniques
              strictement necessaires au fonctionnement du service. Aucun cookie
              publicitaire ou de tracking n'est utilise.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Reclamation
            </h2>
            <p className="text-gray-600">
              Si vous estimez que vos droits ne sont pas respectes apres nous
              avoir contactes, vous pouvez introduire une reclamation aupres de
              la CNIL (Commission Nationale de l'Informatique et des Libertes) :
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-gray-700">
                <strong>CNIL</strong>
                <br />
                3 Place de Fontenoy, TSA 80715
                <br />
                75334 PARIS CEDEX 07
                <br />
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                  www.cnil.fr <ExternalLink className="h-4 w-4" />
                </a>
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Contact DPO
            </h2>
            <p className="text-gray-600">
              Pour toute question relative a la protection de vos donnees
              personnelles, vous pouvez contacter notre Delegue a la Protection
              des Donnees (DPO) :
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-gray-700">
                <strong>Email :</strong> {dpoEmail}
                <br />
                <strong>Adresse :</strong> {cabinetAddress}
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Modifications
            </h2>
            <p className="text-gray-600">
              Cette politique de confidentialite peut etre modifiee a tout
              moment. Toute modification substantielle vous sera notifiee. La
              date de derniere mise a jour est indiquee en haut de ce document.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} {cabinetName} - Tous droits reserves
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link
              to="/rgpd"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Exercer mes droits RGPD
            </Link>
            <span className="text-gray-300">|</span>
            <a
              href={`mailto:${cabinetEmail}`}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
