import dark from '../../../docs/assets/logo-dark.svg'
import light from '../../../docs/assets/logo-light.svg'

/** The Terse wordmark, swapping artwork with the theme. Same files as the README. */
export default function Logo() {
  return (
    <a href="#" aria-label="Terse home" className="inline-flex shrink-0">
      <img src={light} alt="Terse" className="h-7 w-auto dark:hidden" />
      <img src={dark} alt="Terse" className="hidden h-7 w-auto dark:block" />
    </a>
  )
}
