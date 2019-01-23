<template>
    <div id="Add">
        <form>
            <input type="text" name="todo" v-model="input.todo" placeholder="TODO" />

            <a class="waves-effect waves-light btn scale-transition" v-on:click="secure()"> ADD </a>
        </form>
    </div>
</template>

<script>
    /* eslint-disable */
    import kuzzle from "../main.js"
    export default {
        name: 'Add',
        data() {
            return {
                input: {
                    todo: "",
                }
            }

        },

        methods: {
            async secure() {

                const driver = {
                    todo: this.input.todo,
                };
                try {
                    if (this.input.todo != "") {
                        const doc = await kuzzle.document.create('todo', 'todo', driver);
                        this.$emit('newTask', this.input.todo, doc._id);
                    } else {
                        M.toast({html: "Cannot add empty todo!"})
                    }
                } catch (error) {
                    M.toast({html: `${error.message}`})
                }
            }
        }
    }
</script>

<style scoped>
    #Add {
        background-color: #FFFFFF;
        border: 1px solid #CCCCCC;
        padding: 20px;
        margin-top: 10px;
    }
</style>