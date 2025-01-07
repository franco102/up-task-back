import { transporter } from "../config/nodemailer"

export class AuthEmail {

    static sendConfirmationEmail=async ({email,name,token}:{email:string,name:string,token:string})=>{
        //Enviar Email
        const info= await transporter.sendMail({
            from:'UpTask <admin@uptask.com>',
            to:email,
            subject:'UpTask - Confirma tu cuenta',
            text:'Uptask - confirma tu cuentra para gestiornar tus tareas',
            html:`<p style="color:blue-light">Hola:${name},has creado tu cuenta em UpTask,
                    ya casi está todo listo, solo deves confirma tu cuenta </p>
                
                <p>Visita el siguiente enlace:</p>    
                <a href="${process.env.FRONTED_URL}/auth/confirm-account">Confirmar cuenta</a>    
                <p>E ingresa el código: <b>${token}</b>:</p>    
                <p>Este token expira en 10 min:</p> `
        })

        console.log('messageId',info.messageId)
    }

    static sendPasswordResetToken=async ({email,name,token}:{email:string,name:string,token:string})=>{
        //Enviar Email
        const info= await transporter.sendMail({
            from:'UpTask <admin@uptask.com>',
            to:email,
            subject:'UpTask - Restablece tu password',
            text:'Uptask - Restablece tu password',
            html:`<p style="color:blue-light">Hola:${name},ha solicitado restablecer  tu passaword.</p>
                <p>Visita el siguiente enlace:</p>    
                <a href="${process.env.FRONTED_URL}/auth/reset-password">Reestablecer Password</a>    
                <p>E ingresa el código: <b>${token}</b>:</p>    
                <p>Este token expira en 10 min:</p> `
        })

        console.log('messageId',info.messageId)
    }
}