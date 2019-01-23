<template>
        <ul id="collection" class="collection">
            <li v-for="item in collec_items" :key=item.index class="collection-item">
                <div> {{ item.message }} <a href="#!" class="secondary-content"><i class="badge" v-on:click="test(`${item.index}`)">Delete</i></a></div>
            </li>
        </ul>
</template>

<script>
    /* eslint-disable */
    import kuzzle from "../main.js"

    export default {
        name: 'collection',
        props: ['collec_items'],
        methods: {
            async test(id) {
                try {
                    await kuzzle.document.delete('todo', 'todo', id);
                    this.$emit('deleteTask', id);

                } catch (error) {
                    M.toast({html: `An error occurred: ${error.message}`})
                }
            }
        }
    }

</script>

<style scoped>
    #collection {
        background-color: #FFFFFF;
        border: 1px solid #CCCCCC;
        padding: 20px;
        margin-top: 10px;
    }
</style>