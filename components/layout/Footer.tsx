// components/layout/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white px-6 py-10">
      <div className="max-w-screen-xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
        <div>
          <h3 className="font-semibold mb-2">Jetnity</h3>
          <ul className="space-y-1">
            <li><a href="#">Über uns</a></li>
            <li><a href="#">Partnerprogramm</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Rechtliches</h3>
          <ul className="space-y-1">
            <li><a href="#">Datenschutz</a></li>
            <li><a href="#">AGB</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Kontakt</h3>
          <ul className="space-y-1">
            <li><a href="#">Support</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Folge uns</h3>
          <ul className="space-y-1">
            <li><a href="#">Instagram</a></li>
            <li><a href="#">TikTok</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} Jetnity – Alle Rechte vorbehalten.
      </div>
    </footer>
  )
}
