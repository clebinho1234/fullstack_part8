const { GraphQLError } = require('graphql')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const jwt = require('jsonwebtoken')

const resolvers = {
    Query: {
      bookCount: async () => Book.collection.countDocuments(),
      authorCount: async () => Author.collection.countDocuments(),
      allBooks: async (root, args) => {
        let books = await Book.find({}).populate('author')
          if (args.author) {
            const author = await Author.findOne({ name: args.author })
            if (author) {
              books = books.filter(book => book.author.equals(author._id))
            }
          }
          if (args.genre) {
            books = books.filter(book => book.genres.includes(args.genre))
          }
          return books
      },
      allAuthors: async () => {
        try {
          const authorsWithBookCount = await Author.aggregate([
            {
              $lookup: {
                from: 'books',
                localField: '_id',
                foreignField: 'author',
                as: 'books'
              }
            },
            {
              $addFields: {
                bookCount: { $size: "$books" },
                id: '$_id'
              }
            }
          ])
          return authorsWithBookCount
        } catch (error) {
          throw new Error('Error fetching authors:', error)
        }
      },
      me: (root, args, context) => {
          const currentUser = context.currentUser
  
          if (!currentUser) {
            throw new GraphQLError('not authenticated', {
              extensions: {
                code: 'BAD_USER_INPUT',
              }
            })
          }
          return currentUser
      }
    },
  
    Mutation: {
      addBook: async (root, args, context) => {
          const currentUser = context.currentUser
  
          if (!currentUser) {
            throw new GraphQLError('not authenticated', {
              extensions: {
                code: 'BAD_USER_INPUT',
              }
            })
          }
  
          let author = await Author.findOne({ name: args.author })
          if(!author) {
              author = new Author({ name: args.author })
              try {
                await author.save()
              } catch (error) {
                throw new GraphQLError('Adding author failed', {
                  extensions: {
                    code: 'BAD_USER_INPUT',
                    invalidArgs: args.author,
                    error
                  }
                })
              }
          }
          const book = new Book({ ...args, author: author.id })
          try {
            await book.save()
          } catch (error) {
            throw new GraphQLError('Adding book failed', {
              extensions: {
                code: 'BAD_USER_INPUT',
                invalidArgs: author.id,
                error
              }
            })
          }

          pubsub.publish('BOOK_ADDED', { bookAdded: book.populate("author") })

          return book.populate("author")
      },
      editAuthor: async (root, args, context) => {
          const currentUser = context.currentUser
  
          if (!currentUser) {
            throw new GraphQLError('not authenticated', {
              extensions: {
                code: 'BAD_USER_INPUT',
              }
            })
          }
  
          const author = await Author.findOne({ name: args.name })
          author.born = args.setBornTo
  
          try {
            await author.save()
          } catch (error) {
            throw new GraphQLError('Saving born failed', {
              extensions: {
                code: 'BAD_USER_INPUT',
                invalidArgs: args.name,
                error
              }
            })
          }
  
        return author
      },
      createUser: async (root, args) => {
        const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })
    
        return user.save()
          .catch(error => {
            throw new GraphQLError('Creating the user failed', {
              extensions: {
                code: 'BAD_USER_INPUT',
                invalidArgs: args.username,
                error
              }
            })
          })
      },
      login: async (root, args) => {
        const user = await User.findOne({ username: args.username })
    
        if ( !user || args.password !== 'secret' ) {
          throw new GraphQLError('wrong credentials', {
            extensions: {
              code: 'BAD_USER_INPUT'
            }
          })        
        }
    
        const userForToken = {
          username: user.username,
          id: user._id,
        }
    
        return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
      },
    },
    Subscription: {
        bookAdded: {
          subscribe: () => pubsub.asyncIterator('BOOK_ADDED')
        },
    },
  }

module.exports = resolvers