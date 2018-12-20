import * as React from 'react'
import { Link } from 'react-router-dom'

import logo from '../../assets/kilt_negative.svg'
import IdentitySelectorComponent from '../IdentitySelector/IdentitySelector'
import Navigation from '../Navigation/Navigation'
import './Header.scss'

type Props = {}

type State = {
  openNavigation: boolean
}

class Header extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      openNavigation: false,
    }
  }

  public render() {
    const { openNavigation } = this.state

    const classes = [
      'Header',
      openNavigation ? 'open-navigation' : 'close-navigation',
    ]

    return (
      <header className={classes.join(' ')}>
        <section>
          <button className="menu" onClick={this.toggleNavigation} />
          <div className="navigation-container" onClick={this.closeNavigation}>
            <Navigation selectRoute={this.closeNavigation} />
          </div>
          <div className="logo-id">
            <Link to="/" className="logo">
              <img src={logo} alt="logo" />
            </Link>
            <IdentitySelectorComponent />
          </div>
        </section>
      </header>
    )
  }

  private toggleNavigation = () => {
    this.setState({
      openNavigation: !this.state.openNavigation,
    })
  }

  private closeNavigation = () => {
    this.setState({
      openNavigation: false,
    })
  }

  // private openNavigation = () => {
  //   this.setState({
  //     openNavigation: true
  //   })
  // }
}

export default Header
