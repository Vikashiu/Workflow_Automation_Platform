import { PrimaryButton } from "@/component/buttons/PrimaryButton";
import { useState } from "react";
import { Input } from "../Input";

export function SolanaSelector({ setMetadata }: {
    setMetadata: (params: any) => void;
}) {
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Configure Payment</h3>
            <div className="space-y-4">
                <Input label="Recipient Address" type="text" placeholder="Solana Public Key" onChange={(e) => setAddress(e.target.value)} />
                <Input label="Amount (SOL)" type="number" placeholder="0.00" onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="pt-4 flex justify-end">
                <PrimaryButton onClick={() => {
                    setMetadata({
                        amount,
                        address
                    })
                }}>Save Configuration</PrimaryButton>
            </div>
        </div>
    )
}
