import type { Request,Response } from 'express' 
import User from '../models/User'
import { checkPassword, hashPassword } from '../utils/auth'
import Token from '../models/Token'
import { generateToken } from '../utils/token'
import { transporter } from '../config/nodemailer'
import { AuthEmail } from '../emails/AuthEmail'
import { generateJWT } from '../utils/jwt'

export class AuthController {
    static createAccount = async (req:Request,res:Response)=>{
        try {
            const {password,email}=req.body 
    
            const userExist=await User.findOne({email})
            if(userExist){
                const error=new Error('El usuario ya esta registrado')
                res.status(409).json({error:error.message})
                return
            }
            //crea un usuario
            const user=new User(req.body) 
            //Hash Password
            user.password=await hashPassword(password); 
            //Generar el token
            const token= new Token()
            token.token=generateToken()
            token.user=user.id
            
            await AuthEmail.sendConfirmationEmail({email:user.email,name:user.name,token:token.token})
    
            await Promise.allSettled([user.save(),token.save()])
    
            res.send('Cuenta creada, reisa tu email para confirmala')
            
        } catch (error) {
            console.log('prueba de errror',error)
            res.status(500).json({error:'Hubo un error'})
        }
    
    }
    static confirmAccount = async (req:Request,res:Response)=>{
        try { 
    
            const tokenExists=await Token.findOne({token:req.body.token})
            if(!tokenExists){
                const error=new Error('El Token no válido')
                res.status(409).json({error:error.message})
                return
            }
            //crea un usuario
            const user=await  User.findById(tokenExists.user) 
            user.confirmed=true  
             
    
            await Promise.allSettled([user.save(),tokenExists.deleteOne()])
    
            res.send('Cuenta confirmada correctamente ')
            
        } catch (error) {
            console.log('prueba de errror',error)
            res.status(500).json({error:'Hubo un error'})
        }
    
    }
    static login = async (req:Request,res:Response)=>{
        try { 
    
            const {password,email}=req.body 


            const userExists=await User.findOne({email})
            if(!userExists){
                const error=new Error('El usuario no existe')
                res.status(404).json({error:error.message})
                return
            }
            if(!userExists.confirmed){
                //Generar el token
                const token= new Token()
                token.token=generateToken()
                token.user=userExists.id
                
                await AuthEmail.sendConfirmationEmail({email:userExists.email,name:userExists.name,token:token.token})
 
                const error=new Error('La cuenta no ha sido confirmada,hemos enviado un email de confirmacion')
                res.status(404).json({error:error.message})
                return

            }
            const isPasswordCorrect=await checkPassword(password,userExists.password)
            if(!isPasswordCorrect){
                const error=new Error('El password es incorrecto')
                res.status(401).json({error:error.message})
                return
            }

            const token=generateJWT({ id:userExists.id })
            res.send(token)
            
        } catch (error) {
            console.log('prueba de errror',error)
            res.status(500).json({error:'Hubo un error'})
        }
    
    }
    static requestConfirmationCode = async (req:Request,res:Response)=>{
        try {
            const {email}=req.body 
    
            const user=await User.findOne({email})
            if(!user){
                const error=new Error('El usuario no esta registrado')
                res.status(404).json({error:error.message})
                return
            }  
            if(user.confirmed){
                const error=new Error('El usuario ya esta confirmado')
                res.status(403).json({error:error.message})
                return
            }  

            //Generar el token
            const token= new Token()
            token.token=generateToken()
            token.user=user.id
            
            await AuthEmail.sendConfirmationEmail({email:user.email,name:user.name,token:token.token})
    
            await Promise.allSettled([user.save(),token.save()])
    
            res.send('se Envio el nuevo Token')
            
        } catch (error) {
            console.log('prueba de errror',error)
            res.status(500).json({error:'Hubo un error'})
        }
    
    }
    static forgotPassword = async (req:Request,res:Response)=>{
        try {
            const {email}=req.body 
    
            const user=await User.findOne({email})
            if(!user){
                const error=new Error('El usuario no esta registrado')
                res.status(404).json({error:error.message})
                return
            }    

            //Generar el token
            const token= new Token()
            token.token=generateToken()
            token.user=user.id
            await token.save()
            
            await AuthEmail.sendPasswordResetToken({email:user.email,name:user.name,token:token.token})
    
    
            res.send('revise tu email para intrusicciones')
            
        } catch (error) {
            console.log('prueba de errror',error)
            res.status(500).json({error:'Hubo un error'})
        } 
    }

    static validateToken = async (req:Request,res:Response)=>{
        try { 
    
            const tokenExists=await Token.findOne({token:req.body.token})
            if(!tokenExists){
                const error=new Error('El Token no válido')
                res.status(409).json({error:error.message})
                return
            } 
    
            res.send('Token valido, valide tu nuevo password')
            
        } catch (error) {
            console.log('prueba de errror',error)
            res.status(500).json({error:'Hubo un error'})
        }
    
    }
    static updatePasswordWithToken = async (req:Request,res:Response)=>{
        try { 
    
            const tokenExists=await Token.findOne({token:req.params.token})
            if(!tokenExists){
                const error=new Error('El Token no válido')
                res.status(409).json({error:error.message})
                return
            } 

            //Obtener el usuario
            const user=await  User.findById(tokenExists.user) 
            //Hash Password
            user.password=await hashPassword(req.body.password); 
    
            await Promise.allSettled([user.save(),tokenExists.deleteOne()])

            res.send('El password se modifico correctamente ')
            
        } catch (error) {
            console.log('prueba de errror',error)
            res.status(500).json({error:'Hubo un error'})
        }
    
    }
    static user = async (req:Request,res:Response)=>{
        res.json(req.user)
    }

    static updateProfile = async (req: Request, res: Response) => {
        const { name, email } = req.body

        const userExists = await User.findOne({email})
        if(userExists && userExists.id.toString() !== req.user.id.toString() ) {
            const error = new Error('Ese email ya esta registrado')
            res.status(409).json({error: error.message})
            return
        }

        req.user.name = name
        req.user.email = email

        try {
            await req.user.save()
            res.send('Perfil actualizado correctamente')
        } catch (error) {
            res.status(500).send('Hubo un error')
        }
    }

    static updateCurrentUserPassword = async (req: Request, res: Response) => {
        const { current_password, password } = req.body

        const user = await User.findById(req.user.id)

        const isPasswordCorrect = await checkPassword(current_password, user.password)
        if(!isPasswordCorrect) {
            const error = new Error('El Password actual es incorrecto')
            res.status(401).json({error: error.message})
            return
        }

        try {
            user.password = await hashPassword(password)
            await user.save()
            res.send('El Password se modificó correctamente')
        } catch (error) {
            res.status(500).send('Hubo un error')
        }
    } 

    static checkPassword = async (req: Request, res: Response) => {
        const { password } = req.body

        const user = await User.findById(req.user.id)

        const isPasswordCorrect = await checkPassword(password, user.password)
        if(!isPasswordCorrect) {
            const error = new Error('El Password es incorrecto')
            res.status(401).json({error: error.message})
            return
        }

        res.send('Password Correcto')
    }

}