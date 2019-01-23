<template>
    <div id="login">
        <h1>Login</h1>
        <div class="row">
            <div class="input-field col s6">
                <input type="text" name="username" v-model="input.username" id="username"/>
                <label for="username">Username</label>
            </div>
            <div class="input-field col s6">
                <input type="password" name="password" v-model="input.password" id = "password"/>
                <label for="password">Password</label>
            </div>
        </div>
        <button class="waves-effect waves-light btn" type="button" v-on:click="login()">Login</button>
    </div>
</template>


<script>
    /* eslint-disable */
    import kuzzle from "../main.js"

    export default {
        name: 'Login',
        data() {
            return {
                input: {
                    username: "",
                    password: ""
                }
            }
        },
        methods: {
            async login() {
                if(this.input.username != "" && this.input.password != "") {

                    const credentials = {username: this.input.username, password: this.input.password};
                    try {
                        const jwt = await kuzzle.auth.login('local', credentials);
                        console.log(jwt);
                        M.toast({html: `Connected as ${this.input.username} on Kuzzle!`})
                        this.$emit("authenticated", true);
                        this.$emit("username", this.input.username);
                        this.$router.replace({ name: "secure" });
                    } catch (error) {
                        M.toast({html: error.message})
                    }
                } else {
                    M.toast({html: 'A username and password must be present !'})
                }
            }
        }
    }
</script>


<style scoped>
    #login {
        width: 500px;
        border: 1px solid #CCCCCC;
        background-color: #FFFFFF;
        margin: auto;
        margin-top: 200px;
        padding: 20px;
    }
</style>