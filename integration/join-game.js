const socket = require('socket.io-client')
const { fromEvent, zip } = require('rxjs')

describe('Game tests', () => {
  let client1;
  let client2;

  before(() => {
    client1 = socket('http://localhost:8443')
    client2 = socket('http://localhost:8443')
  })

  it('join game as single user', (done) => {
    const socket1Stream = fromEvent(client1, 'connect')
    const socket2Stream = fromEvent(client2, 'connect')

    zip(socket1Stream, socket2Stream)
      .subscribe((data) => {
        const client1Messages = fromEvent(client1, 'message')
        const client2Messages = fromEvent(client2, 'message')

        let player1;
        let gameId;
        let text;

        client1Messages.subscribe(data => {
          if (data.type === 'joined-game') {
            player1 = data.payload.players[0].id
            gameId = data.payload.id
          }

          if (data.type === 'text-drawn') {
            text = data.payload.text
          }

          if (data.type === 'start-game') {
            client1.emit('message', {
              type: 'player-status',
              payload: {
                gameId,
                playerId: player1,
                currentCharacter: 30
              }
            })

            setTimeout(() => {
              client1.emit('message', {
                type: 'player-status',
                payload: {
                  gameId,
                  playerId: player1,
                  currentCharacter: text.length
                }
              })

              setTimeout(() => {
                client1.disconnect()
                client2.disconnect()
                done()
              }, 2000)
            }, 15000)
          }
        })

        client2Messages.subscribe(data => {
          console.log(data)
        })

        client1.emit('message', {
          type: 'join-game',
          payload: {
            name: 'Adam'
          }
        }),
        client2.emit('message', {
          type: 'join-game',
          payload: {
            name: 'John'
          }
        })
      })
  }).timeout(2000000)
})