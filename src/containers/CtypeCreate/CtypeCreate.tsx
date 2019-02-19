import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'

import CTypeEditor from '../../components/CtypeEditor/CtypeEditor'
import BlockchainService from '../../services/BlockchainService'
import ctypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import FeedbackService, { notifySuccess } from '../../services/FeedbackService'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { ICType } from '../../types/Ctype'
import { BlockUi } from '../../types/UserFeedback'

import './CtypeCreate.scss'

type Props = RouteComponentProps<{}> & {
  selectedIdentity?: Wallet.Entry
}

type State = {
  connected: boolean
  cType: any
  isValid: boolean
}

class CTypeCreate extends React.Component<Props, State> {
  private blockchain: sdk.Blockchain

  constructor(props: Props) {
    super(props)

    this.state = {
      cType: { title: '' },
      connected: false,
      isValid: false,
    }

    this.submit = this.submit.bind(this)
    this.cancel = this.cancel.bind(this)
  }

  public componentDidMount() {
    this.connect()
  }

  public async connect() {
    // TODO: test unmount and host change
    // TODO: test error handling
    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Connecting to block chain',
    })
    this.blockchain = await BlockchainService.connect()
    this.setState({ connected: true })
    blockUi.remove()
  }

  public async submit() {
    if (
      this.props.selectedIdentity &&
      this.state.connected &&
      this.state.isValid
    ) {
      const { selectedIdentity, history } = this.props
      const authorAlias: string = selectedIdentity.metaData.name
      let cType: sdk.CType

      try {
        cType = sdk.CType.fromInputModel(this.state.cType)
      } catch (error) {
        errorService.log({
          error,
          message: 'could not create CTYPE from Input Model',
          origin: 'CTypeCreate.submit()',
        })
        return
      }

      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Creating CTYPE',
        message: 'creating CTYPE (1/3)',
      })

      cType
        .store(this.blockchain, selectedIdentity.identity, () => {
          blockUi.updateMessage(
            `CTYPE stored on blockchain,\nnow registering CTYPE (3/3)`
          )
          const ctypeWrapper: ICType = {
            cType,
            metaData: {
              author: authorAlias,
            },
          }
          // TODO: add onrejected when sdk provides error handling
          ctypeRepository.register(ctypeWrapper).then(() => {
            blockUi.remove()
            notifySuccess(
              `CTYPE ${cType.metadata.title.default} successfully created.`
            )
            history.push('/cType')
          })
        })
        .then(() => {
          blockUi.updateMessage(
            `CTYPE created. Now submitting to blockchain (2/3)`
          )
        })
        .catch(error => {
          errorService.log({
            error,
            message: 'Could not submit CTYPE',
            origin: 'CTypeCreate.submit()',
          })
          blockUi.remove()
        })
    }
  }

  public render() {
    return (
      <section className="CTypeCreate">
        <h1 className="App-title">Create CTYPE</h1>
        <CTypeEditor
          cType={this.state.cType}
          updateCType={this.updateCType}
          submit={this.submit}
          cancel={this.cancel}
          connected={this.state.connected}
          isValid={this.state.isValid}
        />
      </section>
    )
  }

  private cancel() {
    // TODO: goto CTYPE list or previous screen?
    this.props.history.push('/cType')
  }

  private updateCType = (cType: string, isValid: boolean) => {
    this.setState({
      cType,
      isValid,
    })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(withRouter(CTypeCreate))
