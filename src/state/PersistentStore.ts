import { combineReducers, createStore, Store } from 'redux'
import * as sdk from '@kiltprotocol/prototype-sdk'

import ErrorService from '../services/ErrorService'
import * as Claims from './ducks/Claims'
import * as UiState from './ducks/UiState'
import * as Wallet from './ducks/Wallet'
import * as Attestations from './ducks/Attestations'

declare global {
  /* tslint:disable */
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any
  }

  /* tslint:enable */
}

type State = {
  claims: Claims.ImmutableState
  uiState: UiState.ImmutableState
  wallet: Wallet.ImmutableState
  attestations: Attestations.ImmutableState
}

type SerializedState = {
  claims: Claims.SerializedState
  uiState: UiState.SerializedState
  wallet: Wallet.SerializedState
  attestations: Attestations.SerializedState
}

class PersistentStore {
  public get store() {
    return this._store
  }

  private static NAME = 'reduxState'

  private static deserialize(obj: SerializedState): State {
    return {
      attestations: Attestations.Store.deserialize(obj.attestations),
      claims: Claims.Store.deserialize(obj.claims),
      uiState: UiState.Store.deserialize(obj.uiState),
      wallet: Wallet.Store.deserialize(obj.wallet),
    }
  }

  private static serialize(state: State): string {
    const obj: SerializedState = {
      attestations: Attestations.Store.serialize(state.attestations),
      claims: Claims.Store.serialize(state.claims),
      uiState: UiState.Store.serialize(state.uiState),
      wallet: Wallet.Store.serialize(state.wallet),
    }

    return JSON.stringify(obj)
  }

  private _store: Store

  constructor() {
    const localState = localStorage.getItem(PersistentStore.NAME)
    let persistedState = {} as State
    if (localState) {
      try {
        persistedState = PersistentStore.deserialize(JSON.parse(localState))
      } catch (error) {
        ErrorService.log({
          error,
          message: 'Could not restore PersistentStore from local storage',
          origin: 'PersistentStore.constructor()',
        })
        // TODO: what to do on failure?
      }
    }

    this._store = createStore(
      combineReducers({
        attestations: Attestations.Store.reducer,
        claims: Claims.Store.reducer,
        uiState: UiState.Store.reducer,
        wallet: Wallet.Store.reducer,
      }),
      persistedState,
      window.__REDUX_DEVTOOLS_EXTENSION__ &&
        window.__REDUX_DEVTOOLS_EXTENSION__()
    )

    this._store.subscribe(() => {
      localStorage.setItem(
        PersistentStore.NAME,
        PersistentStore.serialize(this._store.getState())
      )
    })
  }

  public getSelectedIdentity(): sdk.Identity {
    return (this.store
      .getState()
      .wallet.get('selectedIdentity') as Wallet.Entry).identity
  }
}

export default new PersistentStore()
