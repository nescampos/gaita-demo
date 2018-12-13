import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import './index.css'

import App from './App'
import persistentStore from './state/PersistentStore'

// import registerServiceWorker from './registerServiceWorker'

ReactDOM.render(
  <Provider store={persistentStore.store}>
    <App />
  </Provider>,
  document.getElementById('root') as HTMLElement
)

// registerServiceWorker()
