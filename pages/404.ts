export default vans.factory.pack(

    async (c, p?) =>c.may(c.tags.div({style: "display:block;width:100vw;text-align:center"}, c.tags.h3("页面走丢了")), p) ,
    async (c,p)=>{
        document.title = '页面走丢了'
    },
    async (c, ps?) => {
    }
)
