import * as React from 'react'
import { ComponentType } from 'react'
import { connect } from 'react-redux'

import Loading from '../components/Loading/Loading'
import NoIdentities from '../components/NoIdentities/NoIdentities'
import NoSelectedIdentity from '../components/NoSelectedIdentity/NoSelectedIdentity'
import * as Wallet from '../state/ducks/Wallet'
import { State as ReduxState } from '../state/PersistentStore'

type Props = {
  identities?: Wallet.Entry[]
  selectedIdentity?: Wallet.Entry
}

const mapStateToProps = (state: ReduxState) => ({
  identities: Wallet.getAllIdentities(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const requiresIdentity = (WrappedComponent: ComponentType) => {
  return connect(mapStateToProps)((props: Props) => {
    const { identities, selectedIdentity } = props
    switch (true) {
      case !identities || !identities.length:
        return <NoIdentities />
      case !selectedIdentity:
        return <NoSelectedIdentity />
      case !!identities && !!identities.length && !!selectedIdentity:
        return <WrappedComponent />
      default:
        return <Loading />
    }
  })
}

export default requiresIdentity
