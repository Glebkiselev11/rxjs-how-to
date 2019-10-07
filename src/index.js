import { fromEvent} from 'rxjs'
import {map, pairwise, switchMap, takeUntil, withLatestFrom, startWith} from 'rxjs/operators'

const canvas = document.querySelector('canvas')
const range = document.getElementById('range')
const color = document.getElementById('color')


// Получаем контекст из канваса
const ctx = canvas.getContext('2d')
const rect = canvas.getBoundingClientRect()
const scale = window.devicePixelRatio

canvas.width = rect.width * scale
canvas.height = rect.height * scale
ctx.scale(scale, scale)

// Отслеживаем ведение мышкой
const mouseMove$ = fromEvent(canvas, 'mousemove')
// Отслеживаем нажим мышкой
const mouseDown$ = fromEvent(canvas, 'mousedown')
// Отслеживаем отпускание мышки
const mouseUp$ = fromEvent(canvas, 'mouseup')
// Отслеживаем когда курсор зашел за пределы
const mouseOut$ = fromEvent(canvas, 'mouseout')

// Функция для более лаконичного создания инпут стримов
function createInputStream(node) {
  return fromEvent(node, 'input')
    .pipe(
      map(e => e.target.value),
      startWith(node.value) // Получаем стартовое значение из инпута range
    )
}

const lineWidth$ = createInputStream(range) // Создаем стрим ширины линии
const strokeStyle$ = createInputStream(color) // Создаем стрим цвета линии



// При нажатии мышки создаем стрим рисования
const stream$ = mouseDown$
  .pipe(
    // Передаем ширину линии из инпута
    withLatestFrom(lineWidth$, strokeStyle$, (_, lineWidth, strokeStyle) => {
      return {
        lineWidth,
        strokeStyle
      }
    }),
    switchMap(options => {
      return mouseMove$
        .pipe(
          map(e => ({
            x: e.offsetX,
            y: e.offsetY,
            options, // Это объек с параметрами, тут лежит ширина линии
          })),
          pairwise(), // Это чтобы заполнять пространство между точками
          takeUntil(mouseUp$), // Прекращаем рисовать как только отпустили мышку
          takeUntil(mouseOut$), // Прекращаем рисовать как только курсор вышел за пределы
        )
    })
  )
  
// Подписываемся на стрим
stream$.subscribe(([from, to]) => {
  const {lineWidth, strokeStyle} = from.options

  ctx.strokeStyle = strokeStyle // Передаем контексту цвет линии
  ctx.lineWidth = lineWidth // Передаем контексту ширину линии

  ctx.beginPath() // Мы начинаем новую линию
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke() // Обозначаем что линию нужно нарисовать
})



  