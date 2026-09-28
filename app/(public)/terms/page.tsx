import type { Metadata } from 'next'
import Link from 'next/link'

import { KANONISCHE_PUBLIC_ORIGIN } from '@/lib/seo/oeffentlicher-origin'

export const metadata: Metadata = {
  title: 'Nutzungsbedingungen / AGB',
  description: 'Jetnity Nutzungsbedingungen / AGB, Version CH-DE 1.0.',
  alternates: { canonical: `${KANONISCHE_PUBLIC_ORIGIN}/terms` },
  robots: { index: false, follow: false },
}

const abschnittClass = 'space-y-4'
const abschnittTitelClass = 'text-2xl font-semibold tracking-[-0.03em] text-brand-900 sm:text-3xl'
const textClass = 'text-base leading-8 text-brand-800/80'
const linkClass =
  'font-medium text-brand-900 underline decoration-brand-900/25 underline-offset-4 transition hover:decoration-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/15'

export default function TermsPage() {
  return (
    <main className="bg-surface-75 text-brand-800">
      <article className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <header className="border-b border-brand-900/10 pb-8 sm:pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            Rechtliches
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-brand-900 sm:text-5xl">
            Jetnity Nutzungsbedingungen / AGB
          </h1>
          <dl className="mt-6 grid gap-2 text-sm leading-6 text-brand-800/70 sm:grid-cols-3 sm:gap-6">
            <div>
              <dt className="font-semibold text-brand-900">Version</dt>
              <dd>CH-DE 1.0</dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-900">Stand</dt>
              <dd>28. September 2026</dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-900">Inkrafttreten</dt>
              <dd>28. September 2026</dd>
            </div>
          </dl>
        </header>

        <div className="mt-10 space-y-12 sm:mt-12 sm:space-y-14">
          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>1. Betreiber und Kontakt</h2>
            <p className={textClass}>
              Jetnity wird von Feirov Global Trading, Einzelunternehmen, betrieben (nachfolgend
              «Jetnity» oder «wir»).
            </p>
            <div className="rounded-2xl border border-brand-900/10 bg-white/65 p-5 text-sm leading-7 text-brand-800/80 sm:p-6">
              <p>
                <strong className="font-semibold text-brand-900">Postadresse:</strong>{' '}
                Meilipromenade 14, 6032 Emmen, Schweiz
              </p>
              <p>
                <strong className="font-semibold text-brand-900">
                  Unternehmens-Identifikationsnummer:
                </strong>{' '}
                CHE-432.441.385
              </p>
              <p>
                <strong className="font-semibold text-brand-900">E-Mail:</strong>{' '}
                <a className={linkClass} href="mailto:info@jetnity.ch">
                  info@jetnity.ch
                </a>
              </p>
              <p>
                <strong className="font-semibold text-brand-900">Website:</strong>{' '}
                <a className={linkClass} href="https://jetnity.com">
                  https://jetnity.com
                </a>
              </p>
            </div>
            <p className={textClass}>
              Die Betreiberangaben sind im{' '}
              <Link className={linkClass} href="/impressum">
                Impressum
              </Link>{' '}
              zugänglich. Angaben zur Bearbeitung von Personendaten und zum Datenschutzkontakt
              enthält die{' '}
              <Link className={linkClass} href="/privacy">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>
              2. Gegenstand, Geltungsbereich und kostenlose Prelaunch-Nutzung
            </h2>
            <p className={textClass}>
              Diese Bedingungen regeln das Verhältnis zwischen dir und Jetnity bei der Nutzung
              unserer eigenen digitalen Leistungen. Diese Fassung ist für den deutschsprachigen
              Schweiz-First Prelaunch bestimmt. Die Abrufbarkeit der Website aus anderen Ländern ist
              keine Zusage, dass dort alle Funktionen angeboten werden oder rechtlich und tatsächlich
              nutzbar sind. Zwingend anwendbare Rechte bleiben auch bei grenzüberschreitender Nutzung
              gewahrt.
            </p>
            <p className={textClass}>
              Jetnity unterstützt die persönliche Reiseplanung und Organisation, insbesondere durch
              Reiseentwürfe und Reise-Arbeitsbereiche, Angaben zu Mitreisenden, persönliche
              Reiseübersichten und unterstützende Informationen. Vergleichs- und
              Weiterleitungsfunktionen gehören zum Produktkonzept; ihr tatsächlicher Umfang richtet
              sich nach den jeweils ausdrücklich verfügbaren Funktionen und Datenquellen.
            </p>
            <p className={textClass}>
              Die derzeit angebotenen eigenen Prelaunch-Funktionen sind kostenlos. Durch
              Registrierung, Reiseplanung oder das Speichern einer Reise entstehen keine
              Abonnement-, Buchungs- oder Zahlungspflichten gegenüber Jetnity. Ankündigungen von
              Jetnity Pro oder künftigen Funktionen sind keine Bestellung und keine Zusage ihrer
              Verfügbarkeit. Kosten deines Internetzugangs und separat abgeschlossener Verträge mit
              Reiseanbietern bleiben davon unberührt.
            </p>
            <p className={textClass}>
              Kostenpflichtige Jetnity-Leistungen würden erst aufgrund eines gesonderten,
              transparenten Angebots und deiner ausdrücklichen Bestellung entstehen. Diese Fassung
              enthält keine Bedingungen für ein aktives Abonnement oder einen aktiven Zahlungsdienst.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>3. Einbeziehung der Bedingungen und Registrierung</h2>
            <p className={textClass}>
              Diese Bedingungen werden nur insoweit Vertragsbestandteil, als sie dir vor
              Vertragsabschluss zugänglich gemacht und wirksam vereinbart werden. Der blosse Besuch
              der Website, das Öffnen dieser Seite oder die Veröffentlichung einer neuen Fassung
              ersetzt deine Zustimmung nicht. Für bestehende Konten wird durch die Veröffentlichung
              keine rückwirkende Zustimmung begründet.
            </p>
            <p className={textClass}>
              Bei der Registrierung mit E-Mail und Passwort kannst du deine Eingaben vor dem Absenden
              prüfen und berichtigen. Die Registrierung setzt voraus, dass du die
              Nutzungsbedingungen über die dafür vorgesehene Auswahl akzeptierst. Die
              Datenschutzerklärung informiert dich über die Datenbearbeitung; sie ist keine pauschale
              Einwilligung in Werbung oder zusätzliche Bearbeitungszwecke.
            </p>
            <p className={textClass}>
              Mit dem Absenden der Registrierung beantragst du ein kostenloses Nutzerkonto. Für eine
              neue Registrierung ist grundsätzlich die Bestätigung deiner E-Mail-Adresse
              erforderlich. Der Vertrag über die Kontonutzung kommt zustande, wenn Jetnity dein Konto
              nach den erforderlichen Bestätigungsschritten zur Nutzung bereitstellt. Eine allgemeine
              Bildschirmmeldung über den Versand einer Bestätigungs-E-Mail ist für sich allein keine
              Zusage, dass ein neues Konto angelegt oder freigeschaltet wurde.
            </p>
            <p className={textClass}>
              Die Nutzung von Gastfunktionen ist auch ohne Konto möglich, soweit diese angeboten
              werden. Gastentwürfe können lokal im verwendeten Browser liegen und bei einem
              Gerätewechsel oder beim Löschen der Browserdaten verloren gehen. Eine Übernahme in ein
              Konto gilt erst dann als erfolgt, wenn sie erfolgreich abgeschlossen wurde. Soweit für
              eine Gastfunktion keine wirksame Einbeziehung dieser Bedingungen stattgefunden hat,
              begründet diese Seite allein keine Zustimmung.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>4. Voraussetzungen für ein eigenes Konto</h2>
            <p className={textClass}>
              Ein eigenes Jetnity-Konto setzt Volljährigkeit, das heisst ein Alter von mindestens 18
              Jahren, und Urteilsfähigkeit voraus. Minderjährige dürfen nur als Mitreisende durch eine
              dazu berechtigte erwachsene Person berücksichtigt werden. Daraus entsteht kein eigenes
              Konto der minderjährigen Person.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>5. Eigene Leistungen und Verträge mit Reiseanbietern</h2>
            <p className={textClass}>
              Jetnitys eigene Leistung besteht in der bereitgestellten digitalen Planungs-,
              Organisations- und gegebenenfalls Vergleichs- oder Weiterleitungsfunktion. Das Erstellen
              eines Reiseplans, eine Preisübersicht, das Speichern einer Option oder ein Vorschlag des
              Assistenten bucht oder reserviert keine Reiseleistung.
            </p>
            <p className={textClass}>
              Soweit Jetnity auf Angebote von Fluggesellschaften, Hotels, Aktivitäten-, Mietwagen-,
              Transfer- oder anderen Transportanbietern verweist, entscheidest du selbst, ob du deren
              Website aufrufst und dort ein Angebot annimmst. Ein Vertrag über eine solche
              Reiseleistung kommt mit der im jeweiligen Buchungsprozess bezeichneten Vertragspartei
              zustande. Für Leistung, Zahlung, Umbuchung, Stornierung und Erstattung gelten die
              wirksam vereinbarten Bedingungen dieses Vertrags und das anwendbare Recht.
            </p>
            <p className={textClass}>
              Jetnity nimmt im aktuellen Prelaunch keine Reisebuchung und keine Zahlung für eine
              Reiseleistung entgegen. Die Zusammenstellung verschiedener Planungselemente oder einer
              Budgetsumme ist kein von Jetnity zum Gesamtpreis verkauftes Reiseangebot. Du erteilst
              Jetnity durch die Reiseplanung keine Vollmacht, kostenpflichtige Verträge in deinem
              Namen abzuschliessen.
            </p>
            <p className={textClass}>
              Die Abgrenzung der Leistungen lässt Jetnitys Verantwortung für eigene Pflichten
              unberührt. Gesetzliche Pflichten, die sich aus einer tatsächlich ausgeübten Rolle
              ergeben, lassen sich nicht durch eine Bezeichnung ausschliessen; das gilt insbesondere
              für zwingende Vorschriften über Pauschalreisen.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>
              6. Suchergebnisse, Preise, Verfügbarkeit und Buchungsstatus
            </h2>
            <p className={textClass}>
              Ein Vergleich erfasst nur die tatsächlich eingebundenen und verfügbaren Datenquellen.
              Jetnity verspricht weder vollständige Marktabdeckung noch den günstigsten Preis oder eine
              bestimmte Auswahl an Anbietern.
            </p>
            <p className={textClass}>
              Preisangaben, Verfügbarkeiten, Fahr- und Flugzeiten, Bedingungen sowie
              Währungsumrechnungen können sich ändern. Schätzungen, manuelle Einträge und
              Planungssummen sind keine bestätigten Anbieterangebote. Massgeblich für eine externe
              Bestellung sind die im jeweiligen Buchungsprozess ausgewiesene Leistung, der dortige
              Gesamtpreis, die Vertragsbedingungen und die Bestätigung der zuständigen Vertragspartei.
            </p>
            <p className={textClass}>
              Prüfe vor einer externen Buchung insbesondere Reisedaten, Namen, Abflug- und
              Ankunftsorte, enthaltene Leistungen, Gepäck, Gebühren, Umbuchungs- und
              Stornierungsbedingungen sowie die tatsächliche Verfügbarkeit. Ein Abrufzeitpunkt oder
              gespeicherter Preis bedeutet nicht, dass ein Angebot bis zur Buchung gültig bleibt.
              Diese Hinweise entbinden Jetnity nicht von eigenen gesetzlichen Informations- und
              Sorgfaltspflichten.
            </p>
            <p className={textClass}>
              Ein von dir erfasster Buchungsstatus oder eine in Jetnity gespeicherte Buchungsnotiz ist
              für sich allein kein Nachweis einer extern bestätigten Reservierung. Bewahre
              Buchungsbestätigungen des jeweiligen Anbieters auf.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>7. Generierte Inhalte, Assistent und Reisehinweise</h2>
            <p className={textClass}>
              Automatisch erzeugte Texte, Antworten, Reisevorschläge, Übersetzungen und
              zusammengefasste Informationen dienen der Unterstützung deiner Planung. Sie können
              unvollständig, unzutreffend oder veraltet sein. Eine überzeugende Formulierung oder eine
              Quellenangabe garantiert weder Richtigkeit noch die Anwendbarkeit auf deine persönliche
              Situation.
            </p>
            <p className={textClass}>
              Jetnity erteilt über diese Funktionen keine verbindliche behördliche Auskunft und keine
              individuelle Rechts-, Visa-, Sicherheits- oder medizinische Beratung. Die Inhalte
              garantieren insbesondere keine Einreiseberechtigung, Visumerteilung, sichere Reise oder
              gesundheitliche Eignung. Prüfe entscheidende Informationen rechtzeitig und erneut vor
              der Abreise bei den zuständigen Behörden, Vertretungen und Leistungserbringern; bei
              persönlichen medizinischen oder rechtlichen Fragen ist eine entsprechend qualifizierte
              Fachperson zuständig.
            </p>
            <p className={textClass}>
              Ein Hinweisstatus wie «geprüft» oder «vollständig» innerhalb deiner Planung bezieht sich
              nur auf die ausdrücklich bezeichneten Angaben und Prüfungen. Er ersetzt keine
              Entscheidung einer Behörde oder eines Reiseanbieters. Jetnity ist kein Notfalldienst und
              bietet keine garantierte laufende Überwachung von Ereignissen oder Reiseänderungen.
            </p>
            <p className={textClass}>
              Du behältst die Entscheidung über die Nutzung von Vorschlägen. Für Jetnitys eigene
              Pflichten und eine allfällige Haftung gilt Ziffer 12.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>8. Konto und Sicherheit</h2>
            <p className={textClass}>
              Verwende eine E-Mail-Adresse, auf die du berechtigt zugreifen kannst, und mache die für
              die jeweilige Funktion erforderlichen Angaben sorgfältig. Halte sie aktuell, soweit dies
              für die Nutzung oder Kommunikation erforderlich ist. Ein freiwilliger Anzeigename muss
              keine zusätzliche Identitätsprüfung ersetzen oder vortäuschen.
            </p>
            <p className={textClass}>
              Schütze dein Passwort, Bestätigungslinks und gegebenenfalls eingerichtete zweite
              Faktoren vor unbefugtem Zugriff. Verwende kein fremdes Konto, gib dich nicht als andere
              Person aus und ermögliche Dritten keinen unberechtigten Zugang. Wenn du einen Missbrauch
              vermutest, sichere dein Konto und informiere Jetnity unter{' '}
              <a className={linkClass} href="mailto:info@jetnity.ch">
                info@jetnity.ch
              </a>
              .
            </p>
            <p className={textClass}>
              Jetnity kann bei sicherheitsrelevanten Aktionen die erneute Anmeldung oder eine
              zusätzliche Bestätigung verlangen. Du haftest nicht allein deshalb für jede fremde
              Handlung, weil sie technisch über dein Konto erfolgt ist; eine Verantwortlichkeit
              beurteilt sich nach den gesetzlichen Voraussetzungen.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>9. Zulässige Nutzung</h2>
            <p className={textClass}>
              Du darfst Jetnity im Rahmen der angebotenen Funktionen und des geltenden Rechts nutzen.
              Unzulässig sind insbesondere:
            </p>
            <ul className="list-disc space-y-3 pl-6 text-base leading-8 text-brand-800/80 marker:text-brand-700">
              <li>
                rechtswidrige, betrügerische, diskriminierende oder bedrohende Handlungen und Inhalte
                sowie Verletzungen fremder Persönlichkeits-, Datenschutz- oder Immaterialgüterrechte;
              </li>
              <li>
                das Hochladen oder Übermitteln von Schadsoftware, Angriffe auf Systeme oder unbefugte
                Zugriffe auf fremde Konten und Daten;
              </li>
              <li>
                die Umgehung von Zugangssperren, Schutzmassnahmen oder Nutzungslimits, insbesondere
                durch missbräuchliche Mehrfachkonten;
              </li>
              <li>
                automatisierte Abrufe oder Eingaben, die den Betrieb unangemessen belasten,
                Schutzmassnahmen umgehen oder unberechtigt Daten erfassen;
              </li>
              <li>
                die Verwendung von Jetnity zur Täuschung über Buchungen, Identitäten, Berechtigungen
                oder die Herkunft von Inhalten.
              </li>
            </ul>
            <p className={textClass}>
              Gesetzlich erlaubte Nutzungen bleiben vorbehalten. Hinweise auf Sicherheitslücken kannst
              du an{' '}
              <a className={linkClass} href="mailto:info@jetnity.ch">
                info@jetnity.ch
              </a>{' '}
              richten; dabei dürfen keine fremden Daten ausgelesen, verändert oder veröffentlicht
              werden.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>10. Nutzerinhalte und Rechte daran</h2>
            <p className={textClass}>
              Rechte an den von dir eingegebenen oder hochgeladenen Inhalten verbleiben bei dir
              beziehungsweise den jeweiligen Rechteinhabern. Jetnity verlangt keine Übertragung
              deines Eigentums oder deiner Urheberrechte.
            </p>
            <p className={textClass}>
              Soweit es zur Ausführung der von dir angeforderten Funktionen erforderlich ist, räumst
              du Jetnity ein nicht ausschliessliches, unentgeltliches Recht ein, deine Inhalte zu
              speichern, technisch zu vervielfältigen, zu verarbeiten und dir anzuzeigen. Die
              Berechtigung umfasst nur die für diese Zwecke erforderliche Einbindung technischer
              Dienstleister. Ein internationaler technischer Betrieb darf dabei nur im Rahmen des
              anwendbaren Datenschutzrechts erfolgen.
            </p>
            <p className={textClass}>
              Die Berechtigung besteht nur für die Dauer und in dem Umfang, die zur Erbringung der
              angeforderten Leistung nötig sind. Nach der Löschung dürfen Inhalte nur noch im
              gesetzlich zulässigen und erforderlichen Rahmen, etwa zur Erfüllung einer gesetzlichen
              Aufbewahrungspflicht oder bis zur ordnungsgemässen Aussonderung aus Sicherungen,
              vorgehalten werden. Damit wird kein Recht zu einer erneuten aktiven Nutzung eingeräumt.
            </p>
            <p className={textClass}>
              Diese Lizenz erlaubt weder eine eigenständige Vermarktung oder den Verkauf deiner
              Inhalte noch deren Verwendung für Werbung oder allgemeines Modelltraining. Sie macht
              private Reiseinhalte nicht öffentlich. Eine künftig angebotene Freigabe an andere
              Personen setzt eine entsprechende, von dir veranlasste Funktion voraus.
            </p>
            <p className={textClass}>
              Du darfst nur Inhalte eingeben, zu deren Nutzung du berechtigt bist. Erfasse Angaben
              über Mitreisende nur, wenn du dazu befugt bist, und informiere sie angemessen über die
              Nutzung. Gib keine Passnummern, Ausweiskopien, vollständigen Zahlungsdaten oder
              Gesundheitsunterlagen in Freitextfelder ein, die für solche Daten nicht vorgesehen sind.
            </p>
            <p className={textClass}>
              Die Bearbeitung von Personendaten richtet sich unabhängig von dieser Lizenz nach dem
              anwendbaren Datenschutzrecht und der Datenschutzerklärung. Diese Lizenz ersetzt keine
              erforderliche Einwilligung und schafft keine zusätzliche datenschutzrechtliche
              Erlaubnis.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>11. Rechte an Jetnity und an Ergebnissen</h2>
            <p className={textClass}>
              Rechte an der Jetnity-Software, Gestaltung, Kennzeichen und eigenen redaktionellen
              Inhalten verbleiben bei Jetnity beziehungsweise den jeweiligen Rechteinhabern. Du
              erhältst die für die bestimmungsgemässe Nutzung der angebotenen Funktionen
              erforderliche, nicht ausschliessliche Nutzungsberechtigung. Rechte an fremden Inhalten,
              Daten und verwendeter Open-Source-Software sowie gesetzliche Nutzungsbefugnisse bleiben
              unberührt.
            </p>
            <p className={textClass}>
              Du darfst deine Reisepläne und die dir zur Verfügung gestellten Planungsergebnisse für
              deine eigene Reiseplanung und die Abstimmung mit deinen Mitreisenden verwenden und
              sichern. Rechte Dritter an eingebundenen Bildern, Texten oder Daten bleiben vorbehalten.
              Jetnity garantiert nicht, dass automatisch erzeugte Ergebnisse urheberrechtlich
              geschützt, exklusiv oder frei von Rechten Dritter sind. Ein exklusives Eigentum an
              sämtlichen automatisch erzeugten Ergebnissen wird dir nicht zugesagt.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>12. Sorgfalt, Haftung und zwingende Rechte</h2>
            <p className={textClass}>
              Jetnity erbringt die eigenen Leistungen mit der nach den Umständen gebotenen Sorgfalt.
              Die Hinweise auf Grenzen einzelner Funktionen beschreiben deren Leistungsumfang; sie
              stellen keinen allgemeinen Ausschluss der Verantwortung für Pflichtverletzungen dar.
            </p>
            <p className={textClass}>
              Für eine Haftung von Jetnity gelten die gesetzlichen Voraussetzungen. Diese Bedingungen
              beschränken insbesondere nicht die Haftung für rechtswidrige Absicht oder grobe
              Fahrlässigkeit, für schuldhaft verursachte Verletzungen von Leben, Körper oder
              Gesundheit oder andere zwingende Haftung.
            </p>
            <p className={textClass}>
              Jetnity übernimmt keine zusätzliche vertragliche Garantie für die Durchführung einer
              externen Reiseleistung. Ansprüche gegen deren Vertragspartei sowie Ansprüche gegen
              Jetnity aus eigenen Pflichtverletzungen bleiben bestehen. Ob ein Schaden Jetnity, einem
              externen Anbieter oder einer anderen Person zuzurechnen ist, richtet sich nach dem
              konkreten Sachverhalt und dem anwendbaren Recht.
            </p>
            <p className={textClass}>
              Zwingende Verbraucher-, Datenschutz-, Gewährleistungs-, Rücktritts-, Widerrufs- und
              sonstige Schutzrechte werden durch diese Bedingungen nicht ausgeschlossen oder
              eingeschränkt.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>13. Verfügbarkeit und Weiterentwicklung</h2>
            <p className={textClass}>
              Jetnity befindet sich im Prelaunch und wird weiterentwickelt. Funktionsumfang und
              technische Grenzen ergeben sich aus der jeweiligen Funktionsbeschreibung. Es wird keine
              unterbrechungsfreie Erreichbarkeit, feste Reaktionszeit oder garantierte Verfügbarkeit
              externer Daten zugesagt.
            </p>
            <p className={textClass}>
              Wartung, Sicherheitsmassnahmen, technische Störungen oder Ausfälle eingebundener Dienste
              können Funktionen zeitweise beeinträchtigen. Jetnity trifft angemessene Massnahmen zur
              Behebung von Störungen. Für absehbare erhebliche Einschränkungen oder die Einstellung
              einer wesentlichen Funktion informieren wir betroffene Nutzende angemessen im Voraus,
              soweit nicht Sicherheitsgründe, gesetzliche Vorgaben oder andere zwingende Umstände ein
              sofortiges Handeln erfordern.
            </p>
            <p className={textClass}>
              Wesentliche vertraglich vereinbarte Leistungen werden nicht allein durch einen Hinweis
              auf dieser Seite beliebig entzogen. Änderungen an vereinbarten Rechten und Pflichten
              richten sich nach Ziffer 16. Bewahre wichtige Reise- und Buchungsunterlagen zusätzlich
              ausserhalb von Jetnity auf. Eine Sicherung durch dich entbindet Jetnity nicht von
              eigenen Pflichten.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>14. Beendigung und verhältnismässige Einschränkungen</h2>
            <p className={textClass}>
              Du kannst die kostenlose Nutzung jederzeit beenden und dein Konto über die angebotene
              Kontolöschfunktion löschen. Bei Schwierigkeiten erreichst du uns unter{' '}
              <a className={linkClass} href="mailto:info@jetnity.ch">
                info@jetnity.ch
              </a>
              . Eine Kontolöschung bei Jetnity storniert keine extern gebuchte Reise und beendet keine
              Verträge mit externen Anbietern. Sichere zuvor noch benötigte Angaben über die
              verfügbaren Funktionen.
            </p>
            <p className={textClass}>
              Bei konkreten Anhaltspunkten für einen erheblichen Verstoss gegen diese Bedingungen,
              einen unbefugten Zugriff oder eine Gefährdung des Betriebs kann Jetnity die betroffene
              Nutzung im erforderlichen und verhältnismässigen Umfang einschränken. Soweit vertretbar,
              informieren wir dich über den Grund und geben dir Gelegenheit zur Stellungnahme oder
              Behebung. Du kannst eine Überprüfung unter{' '}
              <a className={linkClass} href="mailto:info@jetnity.ch">
                info@jetnity.ch
              </a>{' '}
              verlangen. Informationen können zurückgestellt werden, soweit gesetzliche Verbote oder
              der Schutz laufender Sicherheitsmassnahmen dies erfordern.
            </p>
            <p className={textClass}>
              Eine dauerhafte Beendigung durch Jetnity setzt einen sachlichen Grund und eine
              angemessene Vorankündigung voraus; eine sofortige Beendigung aus wichtigem Grund bleibt
              vorbehalten. Soweit rechtlich und sicherheitstechnisch möglich, erhältst du Gelegenheit,
              eigene Daten vor der Beendigung zu sichern. Gesetzliche Ansprüche und
              Aufbewahrungspflichten bleiben unberührt. Einzelheiten zur Datenbearbeitung und Löschung
              enthält die Datenschutzerklärung.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>15. Kommerzielle Beziehungen und Affiliate-Hinweise</h2>
            <p className={textClass}>
              Jetnity ist als Planungs-, Vergleichs- und Referral-Plattform konzipiert. Aus dieser
              Beschreibung folgt nicht, dass eine bestimmte Partnerschaft, Buchungsschnittstelle oder
              Provisionsvereinbarung bereits aktiv ist. Diese Fassung bestätigt keine aktive
              Partnerschaft mit einem bestimmten Reiseanbieter.
            </p>
            <p className={textClass}>
              Soweit künftig ein kommerzieller Empfehlungs- oder Affiliate-Link angeboten wird, kann
              Jetnity bei einem Klick oder einem Vertragsabschluss eine Vergütung erhalten. Solche
              Beziehungen und gegebenenfalls vergütete Platzierungen müssen bei der jeweiligen
              Funktion beziehungsweise dem betreffenden Angebot erkennbar gemacht werden. Ein
              möglicher Einfluss einer Vergütung auf die Darstellung oder Sortierung darf nicht als
              rein neutraler Qualitätsvergleich ausgegeben werden.
            </p>
            <p className={textClass}>
              Eine solche Vergütung macht Jetnity nicht zur Vertragspartei der externen
              Reiseleistung. Sie ist auch keine Zusage, dass der Anbieterpreis mit oder ohne
              Weiterleitung identisch ist. Es gelten die transparent dargestellten Bedingungen des
              jeweiligen Angebots. Eine zusätzliche Zahlungspflicht gegenüber Jetnity entsteht durch
              diese allgemeine Erläuterung nicht.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>16. Fassungen, Änderungen und zusätzliche Angebote</h2>
            <p className={textClass}>
              Jede freigegebene Fassung erhält eine eindeutige Versionsnummer und ein
              Veröffentlichungs- beziehungsweise Inkrafttretensdatum. Du kannst die zugänglich
              gemachte Fassung für deine Unterlagen speichern und ausdrucken. Massgeblich ist die mit
              dir wirksam vereinbarte Fassung.
            </p>
            <p className={textClass}>
              Wesentliche Änderungen werden betroffenen Nutzenden vor der beabsichtigten Anwendung mit
              einer verständlichen Erläuterung und dem vorgesehenen Datum mitgeteilt. Soweit eine
              Zustimmung zur Vertragsänderung erforderlich ist, wird sie eingeholt. Schweigen oder die
              blosse weitere Nutzung gelten nicht als Zustimmung. Bereits entstandene Ansprüche werden
              nicht rückwirkend verändert.
            </p>
            <p className={textClass}>
              Wenn du eine vorgeschlagene Änderung nicht akzeptierst, wird sie nicht allein deshalb
              Vertragsbestandteil. Ob und unter welchen Voraussetzungen die Nutzung unter den
              bisherigen Bedingungen fortgesetzt oder das Vertragsverhältnis beendet werden kann,
              richtet sich nach der bisherigen Vereinbarung und dem anwendbaren Recht.
            </p>
            <p className={textClass}>
              Für spätere kostenpflichtige Leistungen, veränderte Buchungsrollen sowie die gezielte
              Erweiterung auf weitere Länder oder Sprachen werden die erforderlichen Bedingungen vor
              ihrer Aktivierung gesondert geprüft, versioniert und zugänglich gemacht. Diese Fassung
              nimmt solche Erweiterungen nicht vorweg.
            </p>
          </section>

          <section className={abschnittClass}>
            <h2 className={abschnittTitelClass}>17. Sprache, Recht und Gerichtsstände</h2>
            <p className={textClass}>
              Diese Fassung ist in deutscher Sprache verfasst. Anderssprachige Fassungen werden erst
              mit ihrer ausdrücklichen Veröffentlichung und Versionskennzeichnung angeboten. Es wird
              kein Vorrang einer noch nicht vorhandenen Übersetzung festgelegt; zwingende
              sprachbezogene Informationsrechte bleiben vorbehalten.
            </p>
            <p className={textClass}>
              Es gilt schweizerisches Recht. Zwingende Schutzvorschriften und zwingende internationale
              Regeln über das anwendbare Recht und die gerichtliche Zuständigkeit bleiben vorbehalten.
              Soweit eine Rechtswahl gesetzlich ausgeschlossen ist, gilt das gesetzlich bestimmte
              Recht. Für Streitigkeiten gelten die gesetzlichen Gerichtsstände. Insbesondere werden
              zwingende Gerichtsstände zugunsten von Konsumentinnen und Konsumenten nicht abbedungen.
            </p>
            <p className={textClass}>
              Sollte eine Bestimmung unwirksam sein oder nicht wirksam vereinbart worden sein, richtet
              sich die weitere Vertragsgeltung nach dem anwendbaren Recht. An ihre Stelle treten,
              soweit vorgesehen, die gesetzlichen Regeln. Eine unwirksame Klausel wird nicht
              automatisch durch eine für Jetnity möglichst günstige Klausel ersetzt.
            </p>
          </section>
        </div>
      </article>
    </main>
  )
}
