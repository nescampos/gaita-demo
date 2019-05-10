import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'
import * as sdk from '@kiltprotocol/prototype-sdk'
import IdentityView from '../../components/IdentityView/IdentityView'
import FeedbackService, {
  safeDelete,
  notifyFailure,
  notifySuccess,
  notifyError,
} from '../../services/FeedbackService'

import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'

import './WalletView.scss'
import { DidService } from '../../services/DidService'

type Props = RouteComponentProps<{}> & {
  selectIdentity: (address: MyIdentity['identity']['address']) => void
  removeIdentity: (address: MyIdentity['identity']['address']) => void
  identities: Wallet.Entry[]
  selectedIdentity?: Wallet.Entry
}

type State = {}

class WalletView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.removeIdentity = this.removeIdentity.bind(this)
  }

  public render() {
    const identities = this.props.identities.map((myIdentity: Wallet.Entry) => {
      let selected = false
      if (this.props.selectedIdentity) {
        selected =
          myIdentity.identity.address ===
          this.props.selectedIdentity.identity.address
      }
      return (
        <IdentityView
          key={myIdentity.identity.address}
          myIdentity={myIdentity}
          selected={selected}
          onDelete={this.removeIdentity}
          onSelect={this.selectIdentity}
          onCreateDid={this.createDid}
          onDeleteDid={this.deleteDid}
        />
      )
    })

    return (
      <section className="WalletView">
        <h1>Wallet / My Identities</h1>
        <div>{identities}</div>
        <div className="actions">
          <Link to="/wallet/add" className="add">
            Add Identity
          </Link>
        </div>
      </section>
    )
  }

  private removeIdentity(address: MyIdentity['identity']['address']) {
    const { identities, removeIdentity } = this.props
    const identityToDelete = identities.find(
      (identity: Wallet.Entry) => identity.identity.address === address
    )

    if (identityToDelete) {
      safeDelete(`your identity '${identityToDelete.metaData.name}''`, () => {
        removeIdentity(identityToDelete.identity.address)
      })
    }
  }

  private createDid(myIdentity: MyIdentity) {
    const blockUi = FeedbackService.addBlockUi({
      headline: `Generating DID for '${myIdentity.metaData.name}'`,
    })
    DidService.createDid(myIdentity) // TODO: add document reference
      .then((did: sdk.IDid) => {
        notifySuccess(
          `DID for '${myIdentity.metaData.name}' successfully generated`
        )
        blockUi.remove()
      })
      .catch(err => {
        notifyError(err)
        blockUi.remove()
      })
  }

  private deleteDid(myIdentity: MyIdentity) {
    safeDelete(`the DID for '${myIdentity.metaData.name}'`, () => {
      const blockUi = FeedbackService.addBlockUi({
        headline: `Removing DID for '${myIdentity.metaData.name}'`,
      })
      DidService.deleteDid(myIdentity)
        .then(() => {
          notifySuccess(
            `Successfully deleted DID for '${myIdentity.metaData.name}'`
          )
          blockUi.remove()
        })
        .catch(err => {
          notifyError(err)
          blockUi.remove()
        })
    })
  }

  private selectIdentity = (address: MyIdentity['identity']['address']) => {
    this.props.selectIdentity(address)
  }
}

const mapStateToProps = (state: ReduxState) => ({
  identities: Wallet.getAllIdentities(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps = (dispatch: (action: Wallet.Action) => void) => {
  return {
    removeIdentity: (address: MyIdentity['identity']['address']) => {
      dispatch(Wallet.Store.removeIdentityAction(address))
    },
    selectIdentity: (address: MyIdentity['identity']['address']) => {
      dispatch(Wallet.Store.selectIdentityAction(address))
    },
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(WalletView)
)
