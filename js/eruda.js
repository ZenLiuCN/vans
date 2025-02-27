
export default async (host)=>{
    await import(`${host??'https://vans.medtreehealth.com'}/js/eruda.min.js`)
    eruda.init()
}
