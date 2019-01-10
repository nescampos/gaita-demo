import * as React from 'react'
import { Route, Switch } from 'react-router-dom'
import Root from '../components/Root/Root'

import ChainStats from '../containers/ChainStats/ChainStats'
import ClaimCreate from '../containers/ClaimCreate/ClaimCreate'
import ClaimView from '../containers/ClaimView/ClaimView'
import ContactList from '../containers/ContactList/ContactList'
import CtypeCreate from '../containers/CtypeCreate/CtypeCreate'
import CtypeView from '../containers/CtypeView/CtypeView'
import MessageList from '../containers/MessageList/MessageList'
import WalletAdd from '../containers/WalletAdd/WalletAdd'
import WalletView from '../containers/WalletView/WalletView'
import requiresIdentity from './RequiresIdentity'

const Routes: React.FunctionComponent<{}> = props => {
  // const bbqBirch = encodeURIComponent('wss://substrate-rpc.parity.io/')
  return (
    <Switch>
      <Route path={'/chain-stats'} component={ChainStats} />
      <Route path={'/contacts'} component={requiresIdentity(ContactList)} />
      <Route path={'/messages'} component={requiresIdentity(MessageList)} />

      <Route path={'/wallet/add'} component={WalletAdd} />
      <Route path={'/wallet'} component={WalletView} />

      <Route path={'/ctype/new'} component={requiresIdentity(CtypeCreate)} />
      <Route
        path={'/ctype/:ctypeKey'}
        component={requiresIdentity(CtypeView)}
      />
      <Route path={'/ctype'} component={requiresIdentity(CtypeView)} />

      <Route
        path={'/claim/new/:ctypeKey'}
        component={requiresIdentity(ClaimCreate)}
      />
      <Route path={'/claim/:id'} component={requiresIdentity(ClaimView)} />
      <Route path={'/claim'} component={requiresIdentity(ClaimView)} />

      <Route component={Root} />
    </Switch>
  )
}

export default Routes