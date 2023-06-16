import {cms} from '@/cms'
import {fromModule, HStack, Stack, Styler} from 'alinea/ui'
import {IcRoundClose} from 'alinea/ui/icons/IcRoundClose'
import {IcRoundHamburger} from 'alinea/ui/icons/IcRoundHamburger'
import {MdiGithub} from 'alinea/ui/icons/MdiGithub'
import {MdiTwitterCircle} from 'alinea/ui/icons/MdiTwitterCircle'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {Home} from '../schema/Home'
import {Logo} from './branding/Logo'
import css from './Header.module.scss'
import {LayoutContainer} from './Layout'

const styles = fromModule(css)

type LinksProps = {
  links: HeaderProps['links']
  style: Styler
}

function Links({links, style}: LinksProps) {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <>
      {links?.map(link => {
        switch (link.type) {
          case 'entry':
            return (
              <Link
                href={link.url}
                key={link.id}
                className={style({
                  active: pathname.startsWith(link.active || link.url)
                })}
              >
                {link.label}
              </Link>
            )
          default:
            return null
        }
      })}
      <Link
        href="/changelog"
        className={style({active: pathname.startsWith('/changelog')})}
      >
        Changelog
      </Link>
      <a href="https://demo.alinea.sh" target="_blank" className={style()}>
        Demo
      </a>
    </>
  )
}

type Link = {
  id: string
  type: string
  url: string
  active?: string
  label: string
}

export async function Header() {
  const links = await cms.get(Home().select(Home.links))
  return (
    <>
      <header className={styles.root()}>
        <LayoutContainer style={{height: '100%'}}>hello header</LayoutContainer>
      </header>
      <div className={styles.mobilemenu()}>
        <div className={styles.mobilemenu.container()}>
          <LayoutContainer className={styles.mobilemenu.top()}>
            hello mobile
          </LayoutContainer>
          <div className={styles.mobilemenu.nav()}>nav tree</div>
        </div>
      </div>
    </>
  )
}

interface MenuProps {
  links?: Array<Link>
  isMobileOpen: boolean
  toggleMobileMenu: () => void
}

function Menu({links, isMobileOpen, toggleMobileMenu}: MenuProps) {
  return (
    <HStack center gap={36} className={styles.root.inner()}>
      <Link href="/" className={styles.root.logo()}>
        <Logo />
      </Link>
      <Stack.Center>
        <HStack as="nav" center className={styles.root.nav()}>
          <Links links={links} style={styles.root.nav.link} />
        </HStack>
      </Stack.Center>
      <HStack gap={16} center>
        {/*<a
          href="https://www.npmjs.com/package/alinea"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            style={{display: 'block'}}
            src="https://img.shields.io/npm/v/alinea.svg?style=flat-square"
          />
        </a>*/}

        <a
          href="/blog/introducing-alinea"
          className={styles.root.nav.link('intro')}
        >
          Introduction 🚀
        </a>
        <a
          href="https://github.com/alineacms/alinea"
          target="_blank"
          className={styles.root.social()}
        >
          <MdiGithub className={styles.root.social.icon()} />
        </a>
        <a
          href="https://twitter.com/alineacms"
          target="_blank"
          className={styles.root.social()}
        >
          <MdiTwitterCircle className={styles.root.social.icon()} />
        </a>
        <button onClick={toggleMobileMenu} className={styles.root.hamburger()}>
          {isMobileOpen ? <IcRoundClose /> : <IcRoundHamburger />}
        </button>
      </HStack>
    </HStack>
  )
}
