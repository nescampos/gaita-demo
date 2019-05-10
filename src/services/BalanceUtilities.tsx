import * as sdk from '@kiltprotocol/prototype-sdk'
import BN from 'bn.js'
import React from 'react'
import { Store } from 'redux'
import ContactPresentation from '../components/ContactPresentation/ContactPresentation'
import KiltToken from '../components/KiltToken/KiltToken'
import * as Balances from '../state/ducks/Balances'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import { Contact, MyIdentity } from '../types/Contact'
import BlockchainService from './BlockchainService'
import { notify, notifySuccess } from './FeedbackService'

const KILT_COIN = 1
const KILT_MICRO_COIN = 1_000_000

// cost of a chain transaction
const TRANSACTION_FEE = 1 * KILT_COIN

// any balance below this will we purged
const MIN_BALANCE = 1 * KILT_COIN

// initial endowment for automatically created accounts
const ENDOWMENT = 100 * KILT_COIN

// TODO: do we need to do something upon deleting an identity?
class BalanceUtilities {
  public static async connect(myIdentity: MyIdentity) {
    const blockchain = await BlockchainService.connect()

    if (
      Balances.getBalance(
        PersistentStore.store.getState(),
        myIdentity.identity.address
      ) == null
    ) {
      blockchain
        .listenToBalanceChanges(
          myIdentity.identity.address,
          BalanceUtilities.listener
        )
        .then(() => {
          notify(
            <div>
              Now listening to balance changes of{' '}
              <ContactPresentation
                address={myIdentity.identity.address}
                inline={true}
              />
            </div>
          )
        })
    }
  }

  public static async getMyBalance(identity: MyIdentity): Promise<number> {
    const blockchain: sdk.Blockchain = await BlockchainService.connect()
    const balance: BN = await blockchain.getBalance(identity.identity.address)
    return BalanceUtilities.asKiltCoin(balance)
  }

  public static connectMyIdentities(store: Store = PersistentStore.store) {
    Wallet.getAllIdentities(store.getState()).forEach(
      (myIdentity: MyIdentity) => {
        BalanceUtilities.connect(myIdentity)
      }
    )
  }

  public static async makeTransfer(
    myIdentity: MyIdentity,
    receiverAddress: Contact['publicIdentity']['address'],
    amount: number,
    successCallback?: () => void
  ) {
    const blockchain = await BlockchainService.connect()

    const transferAmount: BN = BalanceUtilities.asMicroKilt(amount)
    blockchain
      .makeTransfer(myIdentity.identity, receiverAddress, transferAmount)
      .then((result: any) => {
        notifySuccess(
          <div>
            <span>Successfully transfered </span>
            <KiltToken amount={amount} />
            <span> to </span>
            <ContactPresentation address={receiverAddress} inline={true} />.
          </div>
        )
        if (successCallback) {
          successCallback()
        }
      })
      .then(() => {
        notify(
          <div>
            <span>Transfer of </span>
            <KiltToken amount={amount} />
            <span> to </span>
            <ContactPresentation address={receiverAddress} inline={true} />
            <span> initiated.</span>
          </div>
        )
      })
  }

  private static async listener(
    account: sdk.PublicIdentity['address'],
    balance: BN,
    change: BN
  ) {
    if (!change.isZero()) {
      const inDeCreased = `${change.gtn(0) ? 'in' : 'de'}creased`

      notify(
        <div>
          Balance of <ContactPresentation address={account} /> {inDeCreased} by{' '}
          <KiltToken
            amount={BalanceUtilities.asKiltCoin(change)}
            colored={true}
          />
          .
        </div>
      )
    }
    PersistentStore.store.dispatch(
      Balances.Store.updateBalance(
        account,
        BalanceUtilities.asKiltCoin(balance)
      )
    )
  }

  private static asKiltCoin(balance: BN): number {
    return balance.divn(KILT_MICRO_COIN).toNumber()
  }

  private static asMicroKilt(balance: number): BN {
    return new BN(balance).muln(KILT_MICRO_COIN)
  }
}

export { BalanceUtilities, ENDOWMENT, TRANSACTION_FEE, MIN_BALANCE }
