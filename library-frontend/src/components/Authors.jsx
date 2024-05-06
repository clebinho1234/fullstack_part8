import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { EDIT_AUTHOR, ALL_AUTHORS } from '../queries'
import PropTypes from 'prop-types'

const Authors = ({ show, authors, setError }) => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')
  const [ editAuthor ] = useMutation(EDIT_AUTHOR, {
    onError: (error) => {
      const messages = error.graphQLErrors.map(e => e.message).join('\n')
      setError(messages)
    },
    update: (cache, response) => {
      cache.updateQuery({ query: ALL_AUTHORS }, ({ allAuthors }) => {
        return {
          allAuthors: allAuthors.concat(response.data.editAuthor),
        }
      })
    },
  })

  if (!show) {
    return null
  }

  const submit = async (event) => {
    event.preventDefault()

    editAuthor({  variables: { name, born } })

    console.log('edit author...')

    setName('')
    setBorn('')
  }

  const handleSelectChange = (event) => {
    setName(event.target.value)
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {localStorage.getItem('library-user-token')
        ? <div>
            <h3>Set birthyear</h3>
            <form onSubmit={submit}>
              <div>
                <select name="selectedAuthor" onChange={handleSelectChange}>
                  {authors.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                born
                <input
                  type="number"
                  value={born}
                  onChange={({ target }) => setBorn(parseInt(target.value))}
                />
              </div>
              <button type="submit">update author</button>
            </form>
          </div>
        : <></>
      }
    </div>
  )
}

Authors.propTypes = {
  show: PropTypes.bool.isRequired,
  authors: PropTypes.array.isRequired,
  setError: PropTypes.func.isRequired
}

export default Authors
