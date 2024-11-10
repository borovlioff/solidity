"use client"
import React , { Component } from "react";
import { ethers } from "ethers";
import { ConnectWallet } from "../../components/ConnectWallet";
import auctionAddress from "../../contracts/DutchAuction-contract-address.json";
import auctionArtifacts from "../../contracts/DutchAuction.json";

const HARD_HAT_NETWORK_id = "1337";
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export default class extends Component {

    constructor(props) {
        super(props);
        this.initialState = {
            selectedAccount: null,
            txBeingSent: null,
            networkError: null,
            transactionError: null,
            balance: null
        };

        this.state = this.initialState;
    }

    _connectionWallet = async () => {
        if(window.ethereum === undefined) {
            this.setState({networkError: "Please install Metamask!"});
            return;
        }

        const [selectedAddress] = await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        if(!this._checkNetwork()) {
            return;
        }

        this.initialize(selectedAddress);

        window.ethereum.on("accountsChanged", ([newAddress]) => {
            if(newAddress === undefined) {
                return this._resetState();
            }

            this.initialize(newAddress);
        })

        window.ethereum.on("chainChanged", () => {
            this._resetState();
        })
    }

    async initialize(selectedAddress) {
        this._provider = new ethers.providers.Web3Provider(window.ethereum);

        this._auction = new ethers.Contract(
            auctionAddress.DutchAuction,
            auctionArtifacts.abi,
            this._provider
        );

        this.setState({
            selectedAddress: selectedAddress,
        }, async () => await this.updateBalance());

        
    }

    async updateBalance() {
        const newBalance = (await this._provider.getBalance(this.state.selectedAddress)).toString();
        this.setState({balance: newBalance});
        console.log(newBalance);
    }

    _resetState() {
        this.setState(this.initialState);
    }

    _checkNetwork = async () => {
        if(window.ethereum.networkVersion === HARD_HAT_NETWORK_id) { 
            return true;
        }

        this.setState({networkError: "Please connect to localhost:8545!"});

        return false;
    }

    _dismissNetworkError = () => {
        this.setState({networkError: null});
    }


    render() {
        if(!this.state.selectedAddress) {
            return (
                <ConnectWallet
                    connectWallet={this._connectionWallet}
                    networkError={this.state.networkError}
                    dismiss={this._dismissNetworkError}
                />
            );
        }

        return <>
            {this.state.balance && <p>{ethers.utils.formatEther(this.state.balance)} ETH</p>}
        </>
    }
}