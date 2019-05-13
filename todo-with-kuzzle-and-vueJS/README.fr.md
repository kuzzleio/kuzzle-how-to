# Todo MVC Step2 - Realtime
## Introduction

Lors de l'étape précédente, nous avons mis en place les bases de notre 
application afin d'avoir une todoList fonctionnelle.

Dans cette nouvelle étape, nous allons ajouter des fonctionnalités [temps réel](https://docs.kuzzle.io/sdk-reference/js/6/realtime-notifications/).
De cette manière, si plusieurs utilisateurs utilisent en même temps notre 
application, ils verront immédiatement apparaitre les changements effectués par
les autre utilisateurs.

## Souscription aux notifications
Le système temps réel de Kuzzle nous permet de recevoir des notifications lors
de créations/suppressions/modifications d'un document dans une collection à 
laquelle on aura préalablement souscrit.

Nous allons donc utiliser la méthode [subscribe](https://docs.kuzzle.io/sdk-reference/js/6/realtime/subscribe/) du controleur realtime du sdk Kuzzle.

Son utilisation est assez simple, elle prend en paramètre l'index et la 
collection à laquelle nous souhaitons souscrire, puis un objet contenant 
des filtres (que nous n'utiliserons pas ici) et enfin une fonction dite 
'callback' qui sera appelée à chaque notification. Elle renvoie une chaine
de caractères contenant le `room ID`.

Nous travaillerons essentiellement sur le fichier `Home.vue`.

Commencez par ajouter `roomId: ''` aux données.

Ensuite, ajoutez une méthode `notificationsCallback()` comme suit,
nous la modifierons plus tard: 
```js
notificationsCallback(notification) {
  // Pour notre application, une notification d'un document correspond
  // forcement à une action sur une tache. 
  if (notification.type === 'document') {
    console.log(notification);
  }
},
```

Ajoutez maintenant une méthode `notificationSubscribe()`:
```js
async notificationSubscribe() {
  try {
    // Nous faisons ici un appel à la fonction subscribe
    // et nous stockons le room ID correspondant à notre souscription
    this.roomId = await kuzzle.realtime.subscribe(
      this.indexName,
      this.currentList.value,
      {},
      this.notificationsCallback
    );
  } catch (error) {
    this.toasted('error', `${error.message}`);
  }
}
```

Appelez ensuite simplement cette fonction dans la fonction `mounted()`:
```js
async mounted() {
  // ...
  try {
    // ...
    await this.notificationSubscribe();
  } catch (error) {
    this.toasted('error', `${error.message}`);
  }
}
```

A partir de ce point, lancer le projet vous permettra de voir les notifications
s'afficher dans la console de votre navigateur.

## Actions sur notifications
Nous allons maintenant modifier la fonction `notificationsCallback()` 
crée précédemment.

Dans le cas d'une notification de type document, ajoutez le code suivant pour 
récupérer les informations du document:
```js
const { _source: newTask, _id: taskId } = notification.result;
```

Ajoutez ensuite la structure suivante, nous ajouterons chacune des actions à
réaliser en fonction de la notification reçue par la suite:
```js
switch (notification.action) {
  case 'create':
    // ...
    break;
  case 'delete':
    // ...
    break;
  case 'update':
    // ...
    break;
}
```

Dans le cas d'une notification `create`, nous allons donc devoir ajouter la
nouvelle tache à notre tableau et afficher un toast.

Ajoutez le code suivant dans le `case 'create':` de la fonction précédente:
```js
this.tasks.push({
  message: newTask.task,
  index: taskId,
  complete: newTask.complete,
  displayed: true
});
this.toasted('info',`New task ${newTask.task}`);
```
Il est important de savoir que nous recevrons toutes les notifications
concernant les taches, y compris celles de nos propres modifications.
Enlevez ces deux actions de notre fonction `addTask()`, afin d'éviter de voir
des taches ajoutées deux fois dans notre tableau.

Pour une notification `delete`, il va simplement falloir filtrer notre tableau
pour retirer la tache concernée, ajoutez le code suivant: 
```js
this.tasks = this.tasks.filter(task => task.index !== taskId);
this.toasted('info',`Task ${taskId} deleted`);
```

Enlevez également ces deux actions de la fonction `deleteTask()`.

Enfin, dans le cas d'un update, il faudra simplement remplacer la tache dans
notre tableau. Pour ce faire, ajouter les lignes suivantes: 
```js
this.tasks.find(task => task.index === taskId).complete =
  newTask.complete;
this.toasted('info', `Task ${newTask.task} updated`);
```

Pour les mêmes raisons que précédemment, retirez les lignes correspondant
à ces deux actions de la fonction `setTaskComplete()`.


Pour finir, ajoutez un appel à la fonction `updateCompleteAll()`, votre fonction doit ressembler à celle-ci:
```js
notificationsCallback(notification) {
  if (notification.type === 'document') {
    const { _source: newTask, _id: taskId } = notification.result;
    switch (notification.action) {
      case 'create':
        this.tasks.push({
          message: newTask.task,
          index: taskId,
          complete: newTask.complete,
          displayed: true
        });
        this.toasted('info', `New task ${newTask.task}`);
        break;
      case 'delete':
        this.tasks = this.tasks.filter(task => task.index !== taskId);
        this.toasted('info', `Task ${taskId} deleted`);
        break;
      case 'update':
        this.tasks.find(task => task.index === taskId).complete =
          newTask.complete;
        this.toasted('info', `Task ${newTask.task} updated`);
        break;
    }
    this.updateCompleteAll();
  }
},
```

Cette étape est terminée ! 
Vous pouvez maintenant lancer votre application et l'ouvrir dans deux fenetres
différentes afin de voir qu'une modification sur l'une est immédiatement
reproduite sur l'autre :)