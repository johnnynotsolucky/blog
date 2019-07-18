import React from "react"

const Item = ({ change }) => {
  return (<li style={{ marginBottom: '0' }}>
    <span
      style = {{
        padding: '.1em .3em',
        borderRadius: '.3em',
        color: '#0077aa',
        background: '#f9f2f4',
        fontSize: '0.8rem',
      }}
    >
      {change.date}
    </span>
    <span
      style = {{
        fontSize: '0.8rem',
      }}
    >
    {' '} - {change.message}
    </span>
  </li>)
}

const Changelog = ({ changelog, limit = false, reverse = false }) => {
  const changes = [...(reverse ? changelog.reverse() : changelog)]

  if (changelog.length > 0) {
    return (
      <ul
        style={{
          display: `flex`,
          flexDirection: 'column',
          flexWrap: `wrap`,
          justifyContent: `space-between`,
          listStyle: `none`,
          padding: 0,
          marginLeft: 0,
          fontFamily: ['Fira Mono', 'Ubuntu Mono', 'monospace'],
          fontSize: '0.8rem',
        }}
      >
        {limit
          ? (<Item change={changes[0]} />)
          : changes.map(change => (<Item key={changes[0]} change={change}/>))
        }
      </ul>
    )
  }

  return null
}

export default Changelog

