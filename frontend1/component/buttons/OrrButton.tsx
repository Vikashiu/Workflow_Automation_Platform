"use client"

export function OrrButton({text, onClickhandler} : {
    text: string
    onClickhandler: () => void
}){
    return <>
    
        <button  className="bg-amber-700 text-white pl-3 pb-1 pr-3 rounded-2xl cursor-pointer" onClick={onClickhandler}>{text}</button>
    
    </>
}