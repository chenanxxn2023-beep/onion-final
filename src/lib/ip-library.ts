export interface IPImage {
  src: string;
  name: string;
  description: string;
}

export const IP_LIBRARY: IPImage[] = [
  {
    src: '/gou-dan/happy.png',
    name: '开心',
    description: '狗蛋开心的表情'
  },
  {
    src: '/gou-dan/excited.png',
    name: '兴奋',
    description: '狗蛋兴奋的表情'
  },
  {
    src: '/gou-dan/sad.png',
    name: '伤心',
    description: '狗蛋伤心的表情'
  },
  {
    src: '/gou-dan/confused.png',
    name: '困惑',
    description: '狗蛋困惑的表情'
  },
  {
    src: '/gou-dan/idea.png',
    name: '灵感',
    description: '狗蛋有想法的表情'
  },
  {
    src: '/gou-dan/down.png',
    name: '低落',
    description: '狗蛋情绪低落的表情'
  }
];
