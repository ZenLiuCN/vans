import {Button, Card, ContentFlex, Footer, Form, Header, Input, style, Switch, Validate,} from '../core/pico'


export default vans.factory.pack(
    async (c, p?) => {
        const i = c.dom.query.get('q')
        const mode = c.state(true)
        const secretValidate = c.state("")
        const usernameValidate = c.state("")
        let url = c.dom.root()
        if (!url.endsWith('authorized')) {
            url = url.substring(0, url.lastIndexOf('/') + 1) + 'authorized'
        }
        c.dom.injectStyle(style.url, style.name)
        return c.may(ContentFlex({}, "padding-top:8vh",
            Card(
                Header("Login"),
                Form({action: url + "/login", method: "post", id: "fo"},
                    ...Validate("username",
                        usernameValidate,
                        {
                            placeholder: "Name",
                        }),
                    ...Validate("secret", secretValidate,
                        {
                            type: () => mode.val ? "number" : "password",
                            placeholder: () => mode.val ? "TOTP" : "Secret",
                        }),
                    Input("query", {value: i, type: "hidden"}),
                    Input("mode", {value: () => mode.val ? '1' : '0', type: "hidden"}),
                    Switch("mode-sw", mode, () => mode.val ? "TOTP Mode" : "Secret Mode"),
                ),
                Footer(Button(
                    () => {
                        {
                            const u = (document.getElementById("username") as HTMLInputElement).value
                            if (u.trim().length < 3) {
                                usernameValidate.val = "required at least 3 characters"
                                return
                            } else {
                                usernameValidate.val = ""
                            }
                        }
                        {
                            const u = (document.getElementById("secret") as HTMLInputElement).value
                            if ((mode.val && u.trim().length < 6) || (!mode.val && u.trim().length < 5)) {
                                secretValidate.val = `required at least ${mode.val ? 6 : 5} characters`
                                return
                            } else {
                                secretValidate.val = ""
                            }
                        }
                        (document.getElementById("fo") as HTMLFormElement).submit()
                    },
                    ['outline'],
                    {},
                    "Login")),
            )
        ), p, false)//never as shadow
    }, async (c, p) => {
        document.title = 'Login'
    },
    async (c, o) => c.dom.uninjectStyle(style.url, style.name))
