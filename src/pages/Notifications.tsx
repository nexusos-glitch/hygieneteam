import { useState } from "react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bell, CheckCheck, UserPlus, FileText, TrendingUp, AlertTriangle, Search, Filter, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AdminOnly from "@/components/AdminOnly";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'staff_joined':
      return <UserPlus className="h-5 w-5 text-primary" />;
    case 'invoice_generated':
      return <FileText className="h-5 w-5 text-green-500" />;
    case 'revenue_alert':
      return <TrendingUp className="h-5 w-5 text-orange-500" />;
    case 'visit_completed':
      return <CheckCheck className="h-5 w-5 text-blue-500" />;
    case 'achievement_earned':
      return <Trophy className="h-5 w-5 text-amber-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'staff_joined':
      return 'Staff Joined';
    case 'invoice_generated':
      return 'Invoice';
    case 'revenue_alert':
      return 'Revenue Alert';
    case 'visit_completed':
      return 'Visit Completed';
    case 'achievement_earned':
      return 'Achievement';
    default:
      return type;
  }
};

const Notifications = () => {
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotifications = notifications.filter((notification) => {
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    const matchesRead = readFilter === "all" || 
      (readFilter === "unread" && !notification.read) ||
      (readFilter === "read" && notification.read);
    const matchesSearch = searchQuery === "" || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesRead && matchesSearch;
  });

  const notificationTypes = [...new Set(notifications.map(n => n.type))];

  return (
    <AdminOnly showFallback>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground">No notifications found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {notifications.length === 0 
                    ? "You don't have any notifications yet" 
                    : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onMarkAsRead={markAsRead}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  return (
    <div 
      className={`flex items-start gap-4 p-4 transition-colors ${
        !notification.read ? 'bg-primary/5' : ''
      }`}
    >
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {notification.message}
            </p>
          </div>
          <Badge variant={notification.read ? "secondary" : "default"} className="flex-shrink-0">
            {getTypeLabel(notification.type)}
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
          {!notification.read && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="h-7 text-xs"
            >
              Mark as read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
