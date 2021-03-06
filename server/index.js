const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const db = require('./models')
const axios = require('axios')
const bcrypt = require('bcrypt') // password hashing function

const port = process.env.PORT || 4001

const app = express()
  .use(cors())
  .use(bodyParser.json())

const { User, Dog, Points } = db
const dogApi = "https://dog.ceo"

// returns a random dog image and its breed name
app.get('/getdog', (req, res) => {
  axios.get(dogApi+'/api/breeds/image/random')
    .then(function(response) {
      let imgUrl = response.data.message // https://dog.ceo/api/img/maltese/n02085936_10199.jpg
      let breed = imgUrl.split('/').slice(-2, -1).join('') // maltese
      res.json({
        url: imgUrl,
        breed: breed
      })
    })
    .catch(function(error) {
      console.error(error)
      res.status(500)
      res.json({ message: 'Oops! There was an error getting your dog. Please try again' })
    })
})

// Vote up: finds or creates a dog by its breed name and returns its id
// next using this dog id it finds or creates a points record which binds together the dog and the current user
// then it updates this record by adding 5 points to the record's points
app.post('/voteup', (req, res) => {
  const { user_id, breed } = req.body
  Dog
  .findOrCreate({ // findorcreate returns an array of two elements
    where: { breed: breed.toLowerCase() }
  })
  .spread((dog, created) => { // the spread divides the array into its two parts
    return dog.id
  })
  .then((dog_id) => {
    return Points.findOrCreate({
      where: { user_id: user_id, dog_id: dog_id },
      defaults: { points: 0 }
    })
  })
  .spread((points, created) => {
    let newPoints = { points: points.points + 5 }
    return points.update(newPoints)
  })
  .then(final => {
    res.json(final)
  })
  .catch(err => {
    res.status(500).send({ message: `something went wrong`, err })
  })
})

// Vote down: finds or creates a dog by its breed name and returns its id
// next using this dog id it finds or creates a points record which binds together the dog and the current user
// then it updates this record by subtracting 3 points to the record's points
app.post('/votedown', (req, res) => {
  const { user_id, breed } = req.body
  Dog
  .findOrCreate({ // findorcreate returns an array of two elements
    where: { breed: breed.toLowerCase() }
  })
  .spread((dog, created) => { // the spread divides the array into its two parts
    return dog.id
  })
  .then((dog_id) => {
    return Points.findOrCreate({
      where: { user_id: user_id, dog_id: dog_id },
      defaults: { points: 0 }
    })
  })
  .spread((points, created) => {
    let newPoints = { points: points.points - 3 }
    return points.update(newPoints)
  })
  .then(final => {
    res.json(final)
  })
  .catch(err => {
    res.status(500).send({ message: `something went wrong`, err })
  })
})

// retrieving users with their id
app.get('/users/:id', (req, res) => {
  User
    .findById(req.params.id)
    .then((user) => {
      if (user) {
        res.json(user)
      } else {
        res.status(404)
        res.json({ message: 'User not found!' })
      }
    })
    .catch((err) => {
      console.error(err)
      res.status(500)
      res.json({ message: 'Oops! There was an error getting the user. Please try again' })
    })
})

// Edit user action
const patchOrPut = (req, res) => {
  User
    .findById(req.params.id)
    .then(user => {
      return user.update(req.body)
    })
    .then(final => {
      res.json(final)
    })
    .catch(err => {
      res.status(500).send({ message: `something went wrong`, err })
    })
}

app.put('/users/:id', patchOrPut)
app.patch('/users/:id', patchOrPut)

// register endpoint
app.post('/users', (req, res) => {
  const user = {
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  }

  User
    .create(user)
    .then(entity => {
      res.status(201)
      res.json({
        id: entity.id,
        email: entity.email
      })
    })
    .catch(err => {
      res.status(500).send({ message: `something went wrong`, err })
    })
})


// //retrieving the doggy rank page
// app.get('/mydoggyrank', (req, res) => {
//   const mydoggyrank = myDoggyRank
//     .findAll()
//     .then((mydoggyrank) => {
//       res.json(mydoggyrank)
//     })
//     .catch((err) => {
//       console.error(err)
//       res.status(500)
//       res.json({ message: 'Oops! There was an error getting your rank. Please try again' })
//     })
// })

app.listen(port, () => {
  console.log(`listening for incoming connections on http://localhost:${port}`)
})
