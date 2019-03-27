import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import ClaimDetailView from '../../../components/ClaimDetailView/ClaimDetailView'
import attestationWorkflow from '../../../services/AttestationWorkflow'
import FeedbackService from '../../../services/FeedbackService'
import { Contact } from '../../../types/Contact'
import { BlockUi } from '../../../types/UserFeedback'

type Props = {
  claimerAddress: Contact['publicIdentity']['address']
  requestForAttestation: sdk.IRequestForAttestation
  onFinished?: () => void
}

type State = {}

class AttestClaim extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.attestClaim = this.attestClaim.bind(this)
  }

  public render() {
    const { requestForAttestation } = this.props
    return (
      <section className="AttestClaim">
        <ClaimDetailView claim={requestForAttestation.claim} />

        <AttestedClaimsListView
          attestedClaims={requestForAttestation.legitimations}
          delegationId={requestForAttestation.delegationId}
          context="legitimations"
        />

        <div className="actions">
          <button onClick={this.attestClaim}>Attest Claim</button>
        </div>
      </section>
    )
  }

  private attestClaim() {
    const { requestForAttestation, onFinished, claimerAddress } = this.props
    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Writing attestation to chain',
    })

    attestationWorkflow
      .approveAndSubmitAttestationForClaim(
        requestForAttestation,
        claimerAddress
      )
      .then(() => {
        blockUi.remove()
        if (onFinished) {
          onFinished()
        }
      })
  }
}

export default AttestClaim
