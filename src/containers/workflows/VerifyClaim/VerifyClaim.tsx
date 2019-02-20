import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import AttestedClaimVerificationView from 'src/components/AttestedClaimVerificationView/AttestedClaimVerificationView'
import Spinner from '../../../components/Spinner/Spinner'

import attestationService from '../../../services/AttestationService'
import contactRepository from '../../../services/ContactRepository'
import cTypeRepository from '../../../services/CtypeRepository'
import { Contact } from '../../../types/Contact'
import { CType, ICType } from '../../../types/Ctype'

type Props = {
  attestedClaims: sdk.IAttestedClaim[]
  context?: 'legitimation'
}

type State = {
  attestersResolved: boolean
  cTypesResolved: boolean
}

class VerifyClaim extends React.Component<Props, State> {
  private cTypeMap: Map<string, CType>

  constructor(props: Props) {
    super(props)
    this.cTypeMap = new Map()
    this.state = {
      attestersResolved: false,
      cTypesResolved: false,
    }
    this.onVerifyAttestation = this.onVerifyAttestation.bind(this)
  }

  public componentDidMount() {
    const { attestedClaims } = this.props
    contactRepository.findAll().then(() => {
      this.setState({
        attestersResolved: true,
      })
    })
    Promise.all(
      attestedClaims.map((attestedClaim: sdk.IAttestedClaim) => {
        return cTypeRepository.findByHash(attestedClaim.request.claim.cType)
      })
    ).then((ctypes: ICType[]) => {
      ctypes.forEach((cType: ICType) => {
        if (cType.cType.hash) {
          this.cTypeMap[cType.cType.hash] = CType.fromObject(cType)
        }
      })
      this.setState({
        cTypesResolved: true,
      })
    })
  }

  public render() {
    const { attestedClaims, context } = this.props
    const { attestersResolved, cTypesResolved } = this.state

    return attestersResolved && cTypesResolved ? (
      <React.Fragment>
        {attestedClaims.map((attestedClaim: sdk.IAttestedClaim) => {
          return (
            <AttestedClaimVerificationView
              key={attestedClaim.attestation.claimHash}
              attestedClaim={attestedClaim}
              context={context}
              ctype={this.cTypeMap[attestedClaim.request.claim.cType]}
              attester={this.getAttester(attestedClaim.attestation.owner)}
              onVerifyAttestatedClaim={this.onVerifyAttestation}
            />
          )
        })}
      </React.Fragment>
    ) : (
      <Spinner size={20} color="#ef5a28" strength={3} />
    )
  }

  private getAttester(
    attesterAddress: Contact['publicIdentity']['address']
  ): Contact | undefined {
    return contactRepository.findByAddress(attesterAddress)
  }

  private async onVerifyAttestation(
    attestation: sdk.IAttestedClaim
  ): Promise<boolean> {
    return attestationService.verifyAttestatedClaim(attestation)
  }
}

export default VerifyClaim
