import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'

import attestationService from '../../services/AttestationService'
import contactRepository from '../../services/ContactRepository'
import AttestedClaimVerificationView from '../AttestedClaimVerificationView/AttestedClaimVerificationView'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import Spinner from '../Spinner/Spinner'

import './AttestedClaimsListView.scss'

type Labels = {
  default: { [key: string]: string }
  legitimations: { [key: string]: string }
}

const LABELS: Labels = {
  default: {
    emptyList: 'No attestations found.',
    h2: 'Attested claims',
  },
  legitimations: {
    emptyList: 'No legitimations found.',
    h2: 'Legitimations',
  },
}

const enum STATUS {
  PENDING = 'pending',
  UNVERIFIED = 'unverified',
  ATTESTED = 'attested',
}

type AttestationStatus = {
  [signature: string]: STATUS
}

type Props = {
  attestedClaims: sdk.IAttestedClaim[]
  context?: 'legitimations'
  onToggleChildOpen?: (closeCallback?: () => void | undefined) => void
}

type State = {
  attestationStatus: AttestationStatus
  canResolveAttesters: boolean
  closeOpenedChild?: () => void
  labels: { [key: string]: string }
  openedAttestedClaim?: sdk.IAttestedClaim
}

class AttestedClaimsListView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.verifyAttestation = this.verifyAttestation.bind(this)
    this.verifyAttestations = this.verifyAttestations.bind(this)

    this.state = {
      attestationStatus: {},
      canResolveAttesters: false,
      labels:
        LABELS[
          props.context && LABELS[props.context] ? props.context : 'default'
        ],
    }

    this.toggleChildOpen = this.toggleChildOpen.bind(this)
    this.closeOpenedChild = this.closeOpenedChild.bind(this)

    setTimeout(() => {
      this.verifyAttestations()
    }, 500)
  }

  public componentDidMount() {
    contactRepository.findAll().then(() => {
      this.setState({
        canResolveAttesters: true,
      })
    })
  }

  public render() {
    const { attestedClaims }: Props = this.props
    const { openedAttestedClaim } = this.state

    const classes = [
      'AttestedClaimsListView',
      openedAttestedClaim ? 'opened' : '',
    ]

    return attestedClaims ? (
      <section className={classes.join(' ')}>
        {this.getAttestations(attestedClaims)}
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
    )
  }

  private getAttestations(attestations: sdk.IAttestedClaim[]) {
    const { attestationStatus, labels, openedAttestedClaim } = this.state
    return (
      <section className="attestations">
        <h2 onClick={this.toggleOpen.bind(this, openedAttestedClaim)}>
          {labels.h2}
        </h2>
        <div className="refresh">
          <button onClick={this.verifyAttestations} />
        </div>

        {!!attestations && !!attestations.length ? (
          <table className={openedAttestedClaim ? 'opened' : ''}>
            <thead>
              <tr>
                <th className="attester">Attester</th>
                <th className="cType">CType</th>
                <th className="status">Attested</th>
                <th />
              </tr>
            </thead>

            {attestations.map((attestedClaim: sdk.IAttestedClaim) => {
              const { signature } = attestedClaim.attestation
              const opened = attestedClaim === openedAttestedClaim

              return (
                <tbody
                  key={attestedClaim.attestation.signature}
                  className={opened ? 'opened' : ''}
                >
                  <tr>
                    <td className="attester">
                      <ContactPresentation
                        address={attestedClaim.attestation.owner}
                      />
                    </td>
                    <td className="attester">
                      <CTypePresentation
                        cTypeHash={attestedClaim.request.claim.cType}
                      />
                    </td>
                    <td className={`status ${attestationStatus[signature]}`}>
                      {attestationStatus[signature] === STATUS.PENDING && (
                        <Spinner size={20} color="#ef5a28" strength={3} />
                      )}
                    </td>
                    <td className="actionsTd">
                      <button
                        className="open"
                        onClick={this.toggleOpen.bind(this, attestedClaim)}
                      />
                    </td>
                  </tr>

                  {opened && (
                    <tr>
                      <td className="listDetailContainer" colSpan={3}>
                        <AttestedClaimsListView
                          attestedClaims={attestedClaim.request.legitimations}
                          context="legitimations"
                          onToggleChildOpen={this.toggleChildOpen}
                        />
                        <div className="back" onClick={this.closeOpenedChild} />
                        <AttestedClaimVerificationView
                          context=""
                          attestedClaim={attestedClaim}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              )
            })}
          </table>
        ) : (
          <div>{labels.emptyList}</div>
        )}
      </section>
    )
  }

  private toggleOpen(attestedClaim: sdk.IAttestedClaim | undefined) {
    const { onToggleChildOpen } = this.props
    const { openedAttestedClaim } = this.state

    this.setState({
      openedAttestedClaim:
        attestedClaim === openedAttestedClaim ? undefined : attestedClaim,
    })

    if (onToggleChildOpen) {
      onToggleChildOpen(
        attestedClaim === openedAttestedClaim
          ? undefined
          : () => {
              this.toggleOpen(openedAttestedClaim)
            }
      )
    }
  }

  private toggleChildOpen(closeCallback?: () => void | undefined) {
    this.setState({ closeOpenedChild: closeCallback })
  }

  private closeOpenedChild() {
    const { closeOpenedChild } = this.state
    if (closeOpenedChild) {
      closeOpenedChild()
    }
  }

  private verifyAttestations(): void {
    const { attestedClaims } = this.props
    attestedClaims.forEach(attestedClaim => {
      this.verifyAttestation(attestedClaim)
    })
  }

  private verifyAttestation(attestedClaim: sdk.IAttestedClaim) {
    const { attestationStatus } = this.state
    const { signature } = attestedClaim.attestation

    // if we are currently already fetching - cancel
    if (attestationStatus[signature] === STATUS.PENDING) {
      return
    }

    attestationStatus[signature] = STATUS.PENDING

    this.setState({
      attestationStatus,
    })

    attestationService
      .verifyAttestatedClaim(attestedClaim)
      .then((verified: boolean) => {
        if (verified) {
          attestationStatus[signature] = STATUS.ATTESTED
        } else {
          attestationStatus[signature] = STATUS.UNVERIFIED
        }

        this.setState({
          attestationStatus,
        })
      })
  }
}

export default AttestedClaimsListView
