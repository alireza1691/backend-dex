export type OrderStatusType = 'Pending' | 'Rejected' | 'Sending' | 'Confirmed';


export type BuyStableCoinRes = {
    id: number
    tokenName: string;
    tokenAddress: string;
    network: string;
    chainId: number;
    priceRatio: number;
    payMethod: string;
    paidAmount: number;
    outAmount: number;
    feeAmount: number;
    orderedAt: Date;
    status: string;
    phoneNumber: string;
    receiverAddress: string;

}