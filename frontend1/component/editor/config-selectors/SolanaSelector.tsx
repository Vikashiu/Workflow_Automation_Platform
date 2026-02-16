
import { useState } from "react";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { Input } from "./Input";

export function SolanaSelector({ setMetadata }: {
    setMetadata: (params: any) => void;
}) {
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");

    return (
        <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-800 mb-2">
                Send SOL to a wallet address on the Solana network.
            </div>
            <Input label={"Recipient Address"} type={"text"} placeholder="Public Key (e.g., 7Xw...)" onChange={(e) => setAddress(e.target.value)} />
            <Input label={"Amount (SOL)"} type={"text"} placeholder="0.1" onChange={(e) => setAmount(e.target.value)} />

            <div className="pt-4 flex justify-end">
                <div className="w-full sm:w-auto">
                    <PrimaryButton onClick={() => {
                        setMetadata({ amount, address })
                    }}>Save Configuration</PrimaryButton>
                </div>
            </div>
        </div>
    );
}
