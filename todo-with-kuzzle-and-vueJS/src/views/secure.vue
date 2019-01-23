<template>
    <div id="secure">
        <Add v-on:newTask="newTask" />
        <Collection :collec_items="this.items"  v-on:deleteTask="deleteTask"/>
    </div>
</template>

<script>
    /* eslint-disable */
    import Navbar from '../components/navbar.vue'
    import Collection from '../components/collection.vue'
    import Add from '../components/add.vue'
    import kuzzle from '../main'

    export default {
        name: 'Secure',
        components: {
            Navbar,
            Collection,
            Add
        },
        data() {
            return {
                items: [
                    {message: "test", index:0},
                    {message: "test", index:1},
                    {message: "test", index:2}

                ]
            }
        },
        methods: {
            fetchCollection: async function() {
                try {
                    this.items = []
                    const results = await kuzzle.document.search(
                        'todo',
                        'todo',
                        {
                            sort: ['_kuzzle_info.createdAt'],
                        },
                        {
                            size: 1000
                        }
                    );
                    for (let i = 0; i < results.hits.length; i++) {
                        console.log(` id = ${results.hits[i]._source.todo}`);
                        this.items.push({message: results.hits[i]._source.todo, index: results.hits[i]._id})
                    }
                } catch(error) {
                    console.error(error.message)
                }

            },
            newTask: function(str, id) {
                M.toast({html: `Document successfully created!`})
                this.items.push({message: str, index: id})
            },
            deleteTask: function(id) {
                for(let i = 0; i < this.items.length; i++){
                    if ( this.items[i].index === id) {
                        this.items.splice(i, 1);
                    }
                }
                M.toast({html: `Document successfully deleted!`})
            }
         },
        mounted() {
            this.fetchCollection()
        }
    }
</script>

<style scoped>
    #secure {
        width: 1024px;
        background-color: #FFFFFF;
        border: 1px solid #CCCCCC;
        padding: 20px;
        margin:auto;
        margin-top: 10px;
    }
</style>