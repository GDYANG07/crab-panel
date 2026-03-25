import { useState } from 'react';
import {
  Button,
  Card,
  Input,
  Badge,
  Modal,
  Spinner,
  Select,
  Toggle,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  useToast,
} from '../components/ui';
import {
  Search,
  User,
  Settings,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';

export default function DesignSystemDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const [toggleStates, setToggleStates] = useState({
    basic: false,
    labeled: true,
    withDesc: false,
  });
  const { showToast } = useToast();

  const selectOptions = [
    { value: 'option1', label: '选项一' },
    { value: 'option2', label: '选项二' },
    { value: 'option3', label: '选项三', disabled: true },
    { value: 'option4', label: '选项四' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[var(--color-primary)] mb-4">
            CrabPanel 设计系统
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            所有基础组件展示与使用示例
          </p>
        </div>

        {/* Button Section */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border)]">
            Button 按钮
          </h2>
          <Card title="变体样式" description="不同视觉风格的按钮">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </Card>

          <Card className="mt-6" title="尺寸大小" description="三种预设尺寸">
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </Card>

          <Card className="mt-6" title="状态与图标" description="加载状态、禁用状态和图标按钮">
            <div className="flex flex-wrap gap-4">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button variant="primary" loading>
                Saving...
              </Button>
              <Button variant="secondary">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button variant="ghost">
                <Plus className="w-4 h-4" />
                Add New
              </Button>
              <Button variant="danger">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </Card>
        </section>

        {/* Card Section */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border)]">
            Card 卡片
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              title="基础卡片"
              description="这是一个带有标题和描述的基础卡片组件"
            >
              <p className="text-[var(--color-text-secondary)]">
                卡片内容是可定制的，可以放置任何 React 节点。
              </p>
            </Card>

            <Card
              title="可悬停卡片"
              description="鼠标悬停时会显示阴影效果"
              hoverable
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    悬停试试看
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    会有上浮效果
                  </p>
                </div>
              </div>
            </Card>

            <Card
              title="带操作的卡片"
              description="右上角可以放置操作按钮"
              headerAction={
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              }
            >
              <div className="flex gap-2">
                <Badge variant="success">Active</Badge>
                <Badge variant="info">v2.0</Badge>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card title="小间距" padding="sm">
              <p className="text-sm text-[var(--color-text-secondary)]">
                padding=&quot;sm&quot; - 紧凑布局
              </p>
            </Card>
            <Card title="中间距（默认）" padding="md">
              <p className="text-sm text-[var(--color-text-secondary)]">
                padding=&quot;md&quot; - 标准布局
              </p>
            </Card>
            <Card title="大间距" padding="lg">
              <p className="text-sm text-[var(--color-text-secondary)]">
                padding=&quot;lg&quot; - 宽松布局
              </p>
            </Card>
          </div>
        </section>

        {/* Input Section */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border)]">
            Input 输入框
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="基础输入">
              <div className="space-y-4">
                <Input label="用户名" placeholder="请输入用户名" />
                <Input
                  label="邮箱"
                  type="email"
                  placeholder="请输入邮箱地址"
                  helperText="我们会发送验证邮件到您的邮箱"
                />
              </div>
            </Card>

            <Card title="带图标和错误">
              <div className="space-y-4">
                <Input
                  label="搜索"
                  placeholder="搜索内容..."
                  prefix={<Search className="w-5 h-5" />}
                />
                <Input
                  label="密码"
                  type="password"
                  placeholder="请输入密码"
                  prefix={<User className="w-5 h-5" />}
                  suffix={<span className="text-xs text-[var(--color-text-secondary)]">显示</span>}
                />
                <Input
                  label="验证码"
                  placeholder="请输入验证码"
                  error="验证码不能为空"
                />
              </div>
            </Card>
          </div>
        </section>

        {/* Badge Section */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border)]">
            Badge 标签
          </h2>
          <Card title="状态标签">
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </Card>
        </section>

        {/* Select Section */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border)]">
            Select 选择器
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="基础下拉选择">
              <Select
                label="选择分类"
                placeholder="请选择一个选项"
                options={selectOptions}
                value={selectedValue}
                onChange={setSelectedValue}
              />
            </Card>
            <Card title="带提示和错误">
              <Select
                label="选择项目"
                placeholder="请选择项目"
                options={selectOptions}
                helperText="选择一个项目以继续"
              />
            </Card>
          </div>
        </section>

        {/* Toggle Section */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border)]">
            Toggle 开关
          </h2>
          <Card title="开关变体">
            <div className="space-y-6">
              <Toggle
                checked={toggleStates.basic}
                onChange={(checked) =>
                  setToggleStates((prev) => ({ ...prev, basic: checked }))
                }
              />
              <Toggle
                label="启用通知"
                checked={toggleStates.labeled}
                onChange={(checked) =>
                  setToggleStates((prev) => ({ ...prev, labeled: checked }))
                }
              />
              <Toggle
                label="自动保存"
                description="编辑内容会自动保存到草稿箱"
                checked={toggleStates.withDesc}
                onChange={(checked) =>
                  setToggleStates((prev) => ({ ...prev, withDesc: checked }))
                }
              />
              <Toggle label="禁用状态" disabled checked />
            </div>
          </Card>
        </section>

        {/* Spinner Section */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border)]">
            Spinner 加载
          </h2>
          <Card title="尺寸大小">
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <Spinner size="sm" />
                <span className="text-xs text-[var(--color-text-secondary)]">Small</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="md" />
                <span className="text-xs text-[var(--color-text-secondary)]">Medium</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="lg" />
                <span className="text-xs text-[var(--color-text-secondary)]">Large</span>
              </div>
            </div>
          </Card>
        </section>

        {/* Modal Section */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border)]">
            Modal 弹窗
          </h2>
          <Card title="弹窗演示">
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setIsModalOpen(true)}>打开基础弹窗</Button>
              <Button variant="danger" onClick={() => setIsConfirmModalOpen(true)}>
                打开确认弹窗
              </Button>
            </div>
          </Card>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="基础弹窗"
            description="这是一个基础的模态弹窗组件示例"
            footer={
              <>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  取消
                </Button>
                <Button onClick={() => setIsModalOpen(false)}>确认</Button>
              </>
            }
          >
            <p className="text-[var(--color-text-primary)]">
              弹窗内容可以包含任何 React 元素。支持自定义标题、描述、底部操作按钮等。
            </p>
          </Modal>

          <Modal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            title="确认删除？"
            description="此操作将永久删除该数据，无法撤销。"
            size="sm"
            footer={
              <>
                <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>
                  取消
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    showToast('删除成功', 'success');
                  }}
                >
                  确认删除
                </Button>
              </>
            }
          >
            <p className="text-[var(--color-text-secondary)]">
              请确认您要删除的项目信息。
            </p>
          </Modal>
        </section>

        {/* Toast Section */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border)]">
            Toast 通知
          </h2>
          <Card title="触发通知">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => showToast('操作成功完成！', 'success')}
              >
                成功通知
              </Button>
              <Button
                variant="danger"
                onClick={() => showToast('发生错误，请重试', 'error')}
              >
                错误通知
              </Button>
              <Button
                variant="secondary"
                onClick={() => showToast('请注意这条警告信息', 'warning')}
              >
                警告通知
              </Button>
              <Button
                variant="ghost"
                onClick={() => showToast('这是一条提示信息', 'info')}
              >
                信息通知
              </Button>
            </div>
          </Card>
        </section>

        {/* Skeleton Section */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border)]">
            Skeleton 骨架屏
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="基础形状">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton variant="circle" width={40} height={40} />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </div>
                </div>
                <Skeleton variant="rect" height={100} />
                <Skeleton variant="text" lines={3} />
              </div>
            </Card>

            <Card title="卡片骨架">
              <SkeletonCard />
            </Card>

            <Card title="表格骨架" className="md:col-span-2">
              <SkeletonTable rows={4} columns={4} />
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-[var(--color-text-secondary)]">
          <p>CrabPanel Design System © 2025</p>
        </footer>
      </div>
    </div>
  );
}
