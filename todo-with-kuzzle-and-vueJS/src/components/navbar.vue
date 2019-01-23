<template>
    <div id="Navbar" class = "navbar-fixed">
        <nav class =" lighten-2">
            <div class="nav-wrapper">
                <a href="#" class="brand-logo center" >  Todo MVC</a>
                <ul id="nav-mobile" class="right hide-on-down">
                    <li><h5> Welcome {{this.username}} ! </h5></li>
                    <li><router-link to="/login" v-on:click.native="logout" replace>Logout</router-link></li>
                </ul>
            </div>
        </nav>
    </div>
</template>

<script>
    /* eslint-disable */

    export default {
        name: 'NavBar',
        props: ['username'],
        methods: {
            logout() {
                this.$emit('logout');
                M.toast({html: `Disconnected !`})
            }
        }
    }
</script>

<style scoped>
    #Navbar {
        background-color: #FFFFFF;
    }
</style>