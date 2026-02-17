import { PrimaryButton } from "@/component/buttons/PrimaryButton";
import { useState } from "react";
import { Input } from "../Input";

export function EmailSelector({ setMetadata }: {
    setMetadata: (params: any) => void;
}) {
    const [email, setEmail] = useState("");
    const [body, setBody] = useState("");

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Configure Email</h3>
            <div className="space-y-4">
                <Input label="Recipient Email" type="email" placeholder="recipient@example.com" onChange={(e) => setEmail(e.target.value)} />
                <Input label="Email Body" type="text" placeholder="Enter your email content..." onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="pt-4 flex justify-end">
                <PrimaryButton onClick={() => {
                    setMetadata({
                        email,
                        body
                    })
                }}>Save Configuration</PrimaryButton>
            </div>
        </div>
    )
}
