"use client"

export function LinkButton({text, onClickHandler} : {
    text:string,
    onClickHandler?: ()=> void
}){
    return <div onClick={onClickHandler} className="cursor-pointer  text-gray-900 pl-2 pr-2 rounded-md hover:bg-gray-100">

        {text}

    </div>
}