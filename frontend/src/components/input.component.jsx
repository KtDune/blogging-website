import { useState } from "react"

const InputBox = ({ name, type, id, value, placeholder, icon }) => {
    const [showPassword, setShowPassword] = useState(false)
    return (
        <div className="relative w-[100%] mb-4">
            <input
                type={
                    type === 'password'
                    ? showPassword ? 'text' : 'password'
                    : type
                }
                name={name}
                placeholder={placeholder}
                defaultValue={value}
                id={id}
                className="input-box"
            />

            <i className={`fi ${icon} input-icon`}></i>

            {
                type === 'password'
                    ? <i
                        className={`fi ${showPassword ? 'fi-rr-eye' : 'fi-rr-eye-crossed'} input-icon left-[auto] right-4 cursor-pointer`}
                        onClick={() => setShowPassword(prev => !prev)}></i>
                    : ''
            }
        </div>
    )
}

export default InputBox