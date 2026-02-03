import crypto from "crypto";

/* Generate random 4-digit OTP numerice-only*/
export const generateOTP = async () =>{
    try {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        return otp;
    } catch (error) {
        throw new Error("Error generating OTP", error);
    }
};

/* Generate OTP 4-digit alphanumeric */
export const generateAlphaNumericOTP = async () =>{
    const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const result = "";
    for (let i=0; i<length; i++){
        const randomIndex = crypto.randomInt(0, characters.length);
        result += characters.charAt(randomIndex);
    };
    return result;
};

