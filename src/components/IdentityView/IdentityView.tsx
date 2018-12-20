import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'
import { Identity } from '@kiltprotocol/prototype-sdk'
import { u8aToHex } from '@polkadot/util'

type Props = {
  identity: Identity
  alias: string
  onDelete: (seedAsHex: string) => void
} & RouteComponentProps<{}>

class IdentityView extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const { identity, alias } = this.props

    return (
      <section className="IdentityView">
        <ul>
          <li>Alias: {alias}</li>
          <li>Phrase: {identity.phrase}</li>
          <li>Seed (as hex): {identity.seedAsHex}</li>
          <li>Public Key: {u8aToHex(identity.signKeyPair.publicKey)}</li>
          <li>
            Encrpytion Public Key: {u8aToHex(identity.boxKeyPair.publicKey)}
          </li>
          <li>
            <button onClick={this.onDelete}>Remove</button>
          </li>
        </ul>
      </section>
    )
  }

  private onDelete = () => {
    this.props.onDelete(this.props.identity.seedAsHex)
  }
}

export default withRouter(IdentityView)
