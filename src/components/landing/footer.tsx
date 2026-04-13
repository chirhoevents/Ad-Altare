import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-near-black text-cream/60">
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Image
              src="/images/logo.png"
              alt="Ad Altare"
              width={540}
              height={205}
              className="h-12 w-auto mb-3"
              quality={100}
            />
            <p className="font-inter text-xs uppercase tracking-[0.2em] text-gold-600 mb-4">
              To the Altar
            </p>
            <p className="font-inter text-sm text-cream/40 leading-relaxed">
              A platform built for Catholic priests and seminarians to manage
              their ordination journey with grace and ease.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-inter text-xs uppercase tracking-[0.2em] text-cream/40 mb-4">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/sign-up"
                  className="font-inter text-sm hover:text-cream transition-colors"
                >
                  Create Your Page
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-in"
                  className="font-inter text-sm hover:text-cream transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="font-inter text-sm hover:text-cream transition-colors"
                >
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-inter text-xs uppercase tracking-[0.2em] text-cream/40 mb-4">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@adaltare.com"
                  className="font-inter text-sm hover:text-cream transition-colors"
                >
                  support@adaltare.com
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <p className="font-inter text-xs text-cream/30 leading-relaxed italic font-cormorant text-base">
                "Thou art a priest forever, after the order of Melchizedek."
              </p>
              <p className="font-inter text-xs text-cream/20 mt-1">— Psalm 110:4</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-cream/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-inter text-xs text-cream/30">
            © {new Date().getFullYear()} Ad Altare. All rights reserved.
          </p>
          <p className="font-inter text-xs text-cream/20">
            Built for the glory of God and the service of His priests.
          </p>
        </div>
      </div>
    </footer>
  );
}
