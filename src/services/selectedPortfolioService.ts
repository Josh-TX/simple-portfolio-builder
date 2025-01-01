import { Portfolio } from "../models/models";

class SelectedPortfolioService{
    constructor(){
        var json = localStorage["temp"];
        this._selectedPortfolios = json ? JSON.parse(json) : [];
    }

    private _selectedPortfolios: Portfolio[] = [];

    addPortfolio(portfolio: Portfolio){
        this._selectedPortfolios.push(portfolio);
        //localStorage["temp"] = JSON.stringify(this._selectedPortfolios);
    }

    getPortfolios(): Portfolio[]{
        return this._selectedPortfolios;
    }

    removePortfolio(portfolio: Portfolio){
        this._selectedPortfolios = this._selectedPortfolios.filter(z => z != portfolio);
    }
}

export var selectedPortfolioService = new SelectedPortfolioService();