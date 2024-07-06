import { Portfolio } from "../models/models";

class SelectedPortfolioService{
    private _selectedPortfolios: Portfolio[] = [];

    addPortfolio(portfolio: Portfolio){
        this._selectedPortfolios.push(portfolio);
    }

    getPortfolios(): Portfolio[]{
        return this._selectedPortfolios;
    }

    removePortfolio(portfolio: Portfolio){
        this._selectedPortfolios = this._selectedPortfolios.filter(z => z != portfolio);
    }
}

export var selectedPortfolioService = new SelectedPortfolioService();